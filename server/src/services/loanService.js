import { LoanModel } from "../models/loan.model.js";
import { LoanScheduleModel } from "../models/loanSchedule.model.js";
import { getTransaction, query } from "../config/database.js";
import { calculatePaymentSchedule } from "../utils/calcInterest.js";

export const LoanService = {
  async listLoans() {
    return await LoanModel.getAll();
  },

  async getLoanDetail(id) {
    const loan = await LoanModel.getById(id);
    if (!loan) return null;

    // Get related schedules, payments, disbursements
    const schedulesRes = await query("SELECT *, amount_due as amount_to_be_paid_back FROM loan_schedule WHERE loan_id = $1 ORDER BY installment_no ASC", [id]);
    const paymentsRes = await query("SELECT * FROM loan_payment WHERE loan_id = $1 ORDER BY payment_date DESC", [id]);
    const disbursementsRes = await query("SELECT * FROM loan_disbursement_line_item WHERE loan_id = $1 ORDER BY disbursement_date DESC", [id]);

    return {
      ...loan,
      schedules: schedulesRes.rows,
      payments: paymentsRes.rows,
      disbursements: disbursementsRes.rows
    };
  },

  // Create a loan and auto-generate schedules atomically
  async createLoan({ account_no, loan_type_id, loan_amount, loan_term, interest_rate, start_date, status }) {
    const tx = await getTransaction();
    try {
      // Find account & customer
      const accRes = await tx.query(`
        SELECT a.*, c.id as customer_id 
        FROM account a
        LEFT JOIN customer c ON a.customer_id = c.id
        WHERE a.account_no = $1
      `, [account_no]);
      const account = accRes.rows[0];
      if (!account) throw new Error("Account No not found");

      // Find loan type limits
      const ltRes = await tx.query("SELECT * FROM loan_type WHERE id = $1", [loan_type_id]);
      const loanType = ltRes.rows[0];
      if (!loanType) throw new Error("Loan type not found");

      // Validate max amount and term
      const amountNum = Number(loan_amount);
      const termNum = Number(loan_term);
      const rateNum = Number(interest_rate || loanType.default_interest_rate);

      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Loan principal amount must be positive and greater than 0");
      }
      if (isNaN(termNum) || termNum <= 0) {
        throw new Error("Loan term must be positive and greater than 0");
      }
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        throw new Error("Loan interest rate must be between 0% and 100%");
      }

      if (amountNum > Number(loanType.max_loan_amount)) {
        throw new Error(`Loan amount exceeds maximal permitted amount (${loanType.max_loan_amount} Baht)`);
      }

      // Create loan header
      const loansRes = await tx.query("SELECT id FROM loan");
      const nextLoanNum = loansRes.rows.length + 1;
      const loanCode = `L${String(nextLoanNum).padStart(3, '0')}`;
      const total_payback_amount = amountNum + (amountNum * rateNum / 100);

      const loanRes = await tx.query(
        `INSERT INTO loan (code, account_id, customer_id, loan_type_id, interest_rate, loan_amount, start_date, loan_term, loan_status, outstanding_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
         [loanCode, account.id, account.customer_id, loan_type_id, rateNum, amountNum, start_date, termNum, status || 'Active', total_payback_amount]
      );
      const loan = loanRes.rows[0];

      // Automatically generate schedules based on interest formula
      const scheduleLines = calculatePaymentSchedule(amountNum, rateNum, termNum, start_date);
      const scheduleCountRes = await tx.query("SELECT COUNT(*) FROM loan_schedule");
      let nextSchId = Number(scheduleCountRes.rows[0].count) + 1;

      for (const s of scheduleLines) {
        const schCode = `SCH-${String(nextSchId++).padStart(3, '0')}`;
        await tx.query(
          `INSERT INTO loan_schedule (code, loan_id, installment_no, due_date, amount_due, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [schCode, loan.id, s.installment_no, s.due_date, s.amount_due, "Unpaid"]
        );
      }

      await tx.commit();
      return loan;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // Save multiple disbursement line items & increase the linked account's balance
  async createDisbursement({ loan_id, lines }) {
    const tx = await getTransaction();
    try {
      // Find loan & account details
      const loanRes = await tx.query(`
        SELECT l.*, a.id as account_id
        FROM loan l
        LEFT JOIN account a ON l.account_id = a.id
        WHERE l.id = $1
      `, [loan_id]);
      const loan = loanRes.rows[0];
      if (!loan) throw new Error("Loan not found");

      // Calculate total existing disbursement amounts for the loan
      const existingDisbRes = await tx.query(
        "SELECT SUM(disbursement_amount) as total FROM loan_disbursement_line_item WHERE loan_id = $1",
        [loan_id]
      );
      const total_disbursed = Number(existingDisbRes.rows[0]?.total || 0);
      const remaining_to_disburse = Number(loan.loan_amount) - total_disbursed;

      let totalDsb = 0;
      for (let i = 0; i < lines.length; i++) {
        totalDsb += Number(lines[i].disbursement_amount) || 0;
      }

      // Validate remaining loan balance limit
      if (totalDsb > remaining_to_disburse + 0.01) {
        throw new Error("Disbursement amount exceeds remaining available loan balance.");
      }

      const dsbCountRes = await tx.query("SELECT COUNT(*) FROM loan_disbursement_line_item");
      let nextDsbId = Number(dsbCountRes.rows[0].count) + 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const amt = Number(line.disbursement_amount) || 0;

        const dsbCode = `DBN${String(nextDsbId++).padStart(2, '0')}`;
        await tx.query(
          `INSERT INTO loan_disbursement_line_item (code, loan_id, disbursement_amount, disbursement_date)
           VALUES ($1, $2, $3, $4)`,
          [dsbCode, loan.id, amt, line.disbursement_date || new Date().toISOString().split("T")[0]]
        );
      }

      // Add disbursement funds into customer's current account balance
      await tx.query(
        `UPDATE account SET current_balance = current_balance + $1 WHERE id = $2`,
        [totalDsb, loan.account_id]
      );

      // Deduct disbursement funds from BANK_CASH account balance
      const bankCashRes = await tx.query("SELECT id, status, account_no FROM account");
      const bankCashAccount = bankCashRes.rows.find(a => a.status === 'BANK_CASH' || a.account_no === '000000000');
      if (bankCashAccount) {
        await tx.query(
          `UPDATE account SET current_balance = current_balance - $1 WHERE id = $2`,
          [totalDsb, bankCashAccount.id]
        );
      }

      // Calculate new total disbursed to determine and update the loan status dynamically
      const updatedDisbRes = await tx.query(
        "SELECT SUM(disbursement_amount) as total FROM loan_disbursement_line_item WHERE loan_id = $1",
        [loan_id]
      );
      const totalDisbursedAmt = Number(updatedDisbRes.rows[0]?.total || 0);

      let nextStatus = "NOT_DISBURSED";
      if (Math.abs(totalDisbursedAmt - Number(loan.loan_amount)) < 0.01) {
        nextStatus = "FULLY_DISBURSED";
      } else if (totalDisbursedAmt > 0) {
        nextStatus = "PARTIALLY_DISBURSED";
      }

      await tx.query(
        "UPDATE loan SET loan_status = $1 WHERE id = $2",
        [nextStatus, loan_id]
      );

      await tx.commit();
      return { totalDisbursed: totalDsb };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // Retrieve raw loan types list
  async getLoanTypes() {
    const res = await query("SELECT * FROM loan_type ORDER BY id ASC");
    return res.rows;
  },

  // Create manual loan schedule
  async createManualSchedules({ loan_id, schedules }) {
    const tx = await getTransaction();
    try {
      for (const s of schedules) {
        const schCode = `SCH-MAN-${loan_id}-${s.installment_no}-${Date.now().toString().slice(-4)}`;
        await tx.query(
          `INSERT INTO loan_schedule (code, loan_id, installment_no, due_date, amount_due, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [schCode, loan_id, s.installment_no, s.due_date, s.amount_due, s.status || "Unpaid"]
        );
      }
      await tx.commit();
      return { count: schedules.length };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
};
