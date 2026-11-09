import { query } from "../config/database.js";

export const LoanScheduleModel = {
  async getByLoanId(loanId) {
    const res = await query("SELECT *, amount_due as amount_to_be_paid_back FROM loan_schedule WHERE loan_id = $1 ORDER BY installment_no ASC", [loanId]);
    return res.rows;
  },

  async getById(id) {
    const res = await query("SELECT *, amount_due as amount_to_be_paid_back FROM loan_schedule WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async create({ code, loan_id, installment_no, due_date, amount_due, amount_to_be_paid_back, status }, tx = null) {
    const executor = tx || { query };
    const amt = amount_due !== undefined ? amount_due : amount_to_be_paid_back;
    const res = await executor.query(
      `INSERT INTO loan_schedule (code, loan_id, installment_no, due_date, amount_due, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, amount_due as amount_to_be_paid_back`,
      [code, loan_id, installment_no, due_date, amt, status || 'Unpaid']
    );
    return res.rows[0];
  },

  async updateStatus(id, status, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `UPDATE loan_schedule SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0];
  }
};
