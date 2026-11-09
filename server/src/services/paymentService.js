import { getTransaction, query } from "../config/database.js";

export const PaymentService = {
  async listPayments() {
    const res = await query(`
      SELECT p.*, l.code as loan_code, c.name as customer_name, c.phone_no as customer_phone
      FROM loan_payment p
      LEFT JOIN loan l ON p.loan_id = l.id
      LEFT JOIN customer c ON l.customer_id = c.id
      ORDER BY p.id DESC
    `);
    return res.rows;
  },

  async getPaymentDetail(id) {
    const res = await query(`
      SELECT p.*, l.code as loan_code, c.name as customer_name, c.phone_no as customer_phone, c.address_line1 as customer_address
      FROM loan_payment p
      LEFT JOIN loan l ON p.loan_id = l.id
      LEFT JOIN customer c ON l.customer_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (res.rows.length === 0) return null;

    const linesRes = await query(`
      SELECT li.*, s.installment_no, s.due_date, s.amount_due, s.amount_due as amount_to_be_paid_back, s.code as schedule_code
      FROM loan_payment_line_item li
      LEFT JOIN loan_schedule s ON li.loan_schedule_id = s.id
      WHERE li.loan_payment_id = $1
      ORDER BY li.id ASC
    `, [id]);

    return {
      header: res.rows[0],
      lines: linesRes.rows
    };
  },

  // Save payment header and line items, update schedule status + decrement outstanding balance + decrement account balance
  async processPayment({ loan_id, payment_date, lines }) {
    const tx = await getTransaction();
    try {
      // Get loan & account details
      const loanRes = await tx.query(`
        SELECT l.*, a.id as account_id, a.current_balance as account_balance
        FROM loan l
        LEFT JOIN account a ON l.account_id = a.id
        WHERE l.id = $1
      `, [loan_id]);
      const loan = loanRes.rows[0];
      if (!loan) throw new Error("Loan not found");

      let totalPaid = 0;
      for (const line of lines) {
        totalPaid += Number(line.amount_paid || 0);
      }

      // Check payback amount limit: existing total paid + new payment must not exceed total payback amount
      const total_payback_amount = Number(loan.loan_amount) + (Number(loan.loan_amount) * Number(loan.interest_rate) / 100);
      const prevRes = await tx.query("SELECT SUM(total_paid) as total_paid_sum FROM loan_payment WHERE loan_id = $1", [loan_id]);
      const existing_total_paid = Number(prevRes.rows[0]?.total_paid_sum || 0);

      if (Math.round((existing_total_paid + totalPaid) * 100) / 100 > Math.round(total_payback_amount * 100) / 100) {
        throw new Error("Payment exceeds remaining payback balance.");
      }

      // Check account funds
      if (Number(loan.account_balance) < totalPaid) {
        throw new Error(`Insufficient funds in customer's account (${loan.account_balance} Baht) to deduct payment (${totalPaid} Baht)`);
      }

      // Calculate new outstanding balance
      const newOutstanding = Math.max(0, Number(loan.outstanding_balance) - totalPaid);

      // Create main payment record
      const paymentCountRes = await tx.query("SELECT COUNT(*) FROM loan_payment");
      const nextPaymentNum = Number(paymentCountRes.rows[0].count) + 1;
      const paymentCode = `LP${nextPaymentNum}`;

      const pRes = await tx.query(
        `INSERT INTO loan_payment (code, loan_id, total_paid, outstanding_balance, payment_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [paymentCode, loan.id, totalPaid, newOutstanding, payment_date || new Date().toISOString().split("T")[0]]
      );
      const paymentHeader = pRes.rows[0];

      // Process lines
      for (const line of lines) {
        let principal = Number(line.principal_amount);
        let interest = Number(line.interest_amount);
        const paid = Number(line.amount_paid);

        // If not specified, default principal & interest split (estimate 70/30)
        if (isNaN(principal) || isNaN(interest)) {
          interest = Number((paid * 0.2).toFixed(2));
          principal = Number((paid - interest).toFixed(2));
        }

        // Insert payment line item
        await tx.query(
          `INSERT INTO loan_payment_line_item (loan_payment_id, loan_schedule_id, amount_paid, principal_amount, interest_amount, applied_interest_rate)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [paymentHeader.id, line.schedule_id, paid, principal, interest, Number(line.applied_interest_rate || loan.interest_rate)]
        );

        // Update schedule status to Paid
        const status = paid >= Number(line.amount_due) ? "Paid" : "Partially Paid";
        await tx.query(
          `UPDATE loan_schedule SET status = $1 WHERE id = $2`,
          [status, line.schedule_id]
        );
      }

      // Deduct from loan outstanding balance
      await tx.query(
        `UPDATE loan SET outstanding_balance = $1 WHERE id = $2`,
        [newOutstanding, loan.id]
      );

      // Deduct payment amount from customer account current balance
      await tx.query(
        `UPDATE account SET current_balance = current_balance - $1 WHERE id = $2`,
        [totalPaid, loan.account_id]
      );

      await tx.commit();
      return paymentHeader;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
};
