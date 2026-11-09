import { query } from "../config/database.js";

export const LoanPaymentModel = {
  async getAll() {
    const res = await query(`
      SELECT p.*, l.code as loan_code, c.name as customer_name, c.phone_no as customer_phone
      FROM loan_payment p
      LEFT JOIN loan l ON p.loan_id = l.id
      LEFT JOIN customer c ON l.customer_id = c.id
      ORDER BY p.id DESC
    `);
    return res.rows;
  },

  async getById(id) {
    const res = await query(`
      SELECT p.*, l.code as loan_code, c.name as customer_name, c.phone_no as customer_phone, c.address_line1 as customer_address,
             a.account_no
      FROM loan_payment p
      LEFT JOIN loan l ON p.loan_id = l.id
      LEFT JOIN customer c ON l.customer_id = c.id
      LEFT JOIN account a ON l.account_id = a.id
      WHERE p.id = $1
    `, [id]);
    return res.rows[0] || null;
  },

  async create({ code, loan_id, total_paid, outstanding_balance, payment_date }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO loan_payment (code, loan_id, total_paid, outstanding_balance, payment_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code, loan_id, total_paid, outstanding_balance, payment_date]
    );
    return res.rows[0];
  },

  async createLineItem({ loan_payment_id, loan_schedule_id, amount_paid, principal_amount, interest_amount, applied_interest_rate }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO loan_payment_line_item (loan_payment_id, loan_schedule_id, amount_paid, principal_amount, interest_amount, applied_interest_rate)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [loan_payment_id, loan_schedule_id, amount_paid, principal_amount, interest_amount, applied_interest_rate]
    );
    return res.rows[0];
  },

  async getLineItemsByPaymentId(paymentId) {
    const res = await query(`
      SELECT li.*, s.installment_no, s.due_date, s.amount_due, s.code as schedule_code
      FROM loan_payment_line_item li
      LEFT JOIN loan_schedule s ON li.loan_schedule_id = s.id
      WHERE li.loan_payment_id = $1
      ORDER BY li.id ASC
    `, [paymentId]);
    return res.rows;
  }
};
