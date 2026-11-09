import { query } from "../config/database.js";

export const LoanModel = {
  async getAll() {
    const res = await query(`
      SELECT l.*, 
             c.name as customer_name, c.phone_no as customer_phone, 
             a.account_no, 
             lt.type_name as loan_type_name,
             COALESCE((SELECT SUM(disbursement_amount) FROM loan_disbursement_line_item WHERE loan_id = l.id), 0) AS total_disbursed,
             l.loan_amount - COALESCE((SELECT SUM(disbursement_amount) FROM loan_disbursement_line_item WHERE loan_id = l.id), 0) AS remaining_to_disburse
      FROM loan l
      LEFT JOIN customer c ON l.customer_id = c.id
      LEFT JOIN account a ON l.account_id = a.id
      LEFT JOIN loan_type lt ON l.loan_type_id = lt.id
      ORDER BY l.id DESC
    `);
    return res.rows;
  },

  async getById(id) {
    const res = await query(`
      SELECT l.*, 
             c.name as customer_name, c.phone_no as customer_phone, c.address_line1 as customer_address,
             a.account_no, a.current_balance as account_balance,
             lt.type_name as loan_type_name, lt.default_interest_rate as type_default_rate, lt.max_term, lt.max_loan_amount,
             COALESCE((SELECT SUM(disbursement_amount) FROM loan_disbursement_line_item WHERE loan_id = l.id), 0) AS total_disbursed,
             l.loan_amount - COALESCE((SELECT SUM(disbursement_amount) FROM loan_disbursement_line_item WHERE loan_id = l.id), 0) AS remaining_to_disburse
      FROM loan l
      LEFT JOIN customer c ON l.customer_id = c.id
      LEFT JOIN account a ON l.account_id = a.id
      LEFT JOIN loan_type lt ON l.loan_type_id = lt.id
      WHERE l.id = $1
    `, [id]);
    return res.rows[0] || null;
  },

  async create({ code, account_id, customer_id, loan_type_id, interest_rate, loan_amount, start_date, loan_term, loan_status, outstanding_balance }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO loan (code, account_id, customer_id, loan_type_id, interest_rate, loan_amount, start_date, loan_term, loan_status, outstanding_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [code, account_id, customer_id, loan_type_id, interest_rate, loan_amount, start_date, loan_term, loan_status || 'Active', outstanding_balance]
    );
    return res.rows[0];
  },

  async updateOutstandingBalance(id, amount, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `UPDATE loan SET outstanding_balance = outstanding_balance + $1 WHERE id = $2 RETURNING *`,
      [amount, id]
    );
    return res.rows[0];
  },

  async delete(id) {
    await query("DELETE FROM loan WHERE id = $1", [id]);
    return true;
  }
};
