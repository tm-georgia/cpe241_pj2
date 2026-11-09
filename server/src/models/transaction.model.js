import { query } from "../config/database.js";

export const TransactionModel = {
  async getAll() {
    const res = await query(`
      SELECT t.*, t.remark as description,
             tt.code as type_code, tt.description as type_description, tt.code as transaction_type,
             ts.code as status_code, ts.description as status_description,
             tb.batch_type, tb.batch_date
      FROM transaction t
      LEFT JOIN transaction_type tt ON t.transaction_type_id = tt.id
      LEFT JOIN transaction_status ts ON t.status_id = ts.id
      LEFT JOIN transfer_batch tb ON t.batch_id = tb.id
      ORDER BY t.id DESC
    `);
    return res.rows;
  },

  async getById(id) {
    const res = await query(`
      SELECT t.*, t.remark as description,
             tt.code as type_code, tt.description as type_description, tt.code as transaction_type,
             ts.code as status_code, ts.description as status_description,
             tb.batch_type, tb.batch_date, tb.description as batch_description
      FROM transaction t
      LEFT JOIN transaction_type tt ON t.transaction_type_id = tt.id
      LEFT JOIN transaction_status ts ON t.status_id = ts.id
      LEFT JOIN transfer_batch tb ON t.batch_id = tb.id
      WHERE t.id = $1
    `, [id]);
    return res.rows[0] || null;
  },

  async getByCode(code) {
    const res = await query(`
      SELECT t.*, t.remark as description,
             tt.code as type_code, tt.description as type_description, tt.code as transaction_type,
             ts.code as status_code, ts.description as status_description,
             tb.batch_type, tb.batch_date, tb.description as batch_description
      FROM transaction t
      LEFT JOIN transaction_type tt ON t.transaction_type_id = tt.id
      LEFT JOIN transaction_status ts ON t.status_id = ts.id
      LEFT JOIN transfer_batch tb ON t.batch_id = tb.id
      WHERE t.transaction_code = $1
    `, [code]);
    return res.rows[0] || null;
  },

  async create({ transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO transaction (transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [transaction_code, amount, transaction_date, remark, transaction_type_id, batch_id, status_id]
    );
    return res.rows[0];
  },

  async createTransferLineItem({ transaction_id, account_id, entry_type_id, amount, description }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO transfer_line_item (transaction_id, account_id, entry_type_id, amount, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [transaction_id, account_id, entry_type_id, amount, description]
    );
    return res.rows[0];
  },

  async createTransferBatch({ batch_type, batch_date, description, status }, tx = null) {
    const executor = tx || { query };
    const res = await executor.query(
      `INSERT INTO transfer_batch (batch_type, batch_date, description, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [batch_type, batch_date, description, status || 'Completed']
    );
    return res.rows[0];
  },

  async getLineItemsByTransactionId(transactionId) {
    const res = await query(`
      SELECT li.*, a.account_no, c.name as customer_name, et.code as entry_type_code
      FROM transfer_line_item li
      LEFT JOIN account a ON li.account_id = a.id
      LEFT JOIN customer c ON a.customer_id = c.id
      LEFT JOIN entry_type et ON li.entry_type_id = et.id
      WHERE li.transaction_id = $1
      ORDER BY li.id ASC
    `, [transactionId]);
    return res.rows;
  },

  async getTypeIdByCode(code) {
    const res = await query("SELECT id FROM transaction_type WHERE code = $1", [code]);
    return res.rows[0]?.id || null;
  },

  async getStatusIdByCode(code) {
    const res = await query("SELECT id FROM transaction_status WHERE code = $1", [code]);
    return res.rows[0]?.id || null;
  },

  async getEntryTypeIdByCode(code) {
    const res = await query("SELECT id FROM entry_type WHERE code = $1", [code]);
    return res.rows[0]?.id || null;
  }
};
