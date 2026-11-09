import { query } from "../config/database.js";

export const AccountModel = {
  async getAll() {
    const res = await query(`
      SELECT a.*, c.name as customer_name, c.code as customer_code, c.phone_no as customer_phone
      FROM account a
      LEFT JOIN customer c ON a.customer_id = c.id
      ORDER BY a.id DESC
    `);
    return res.rows;
  },

  async getById(id) {
    const res = await query(`
      SELECT a.*, c.name as customer_name, c.code as customer_code, c.phone_no as customer_phone, c.address_line1 as customer_address
      FROM account a
      LEFT JOIN customer c ON a.customer_id = c.id
      WHERE a.id = $1
    `, [id]);
    return res.rows[0] || null;
  },

  async getByAccountNo(accountNo) {
    const res = await query(`
      SELECT a.*, c.name as customer_name, c.code as customer_code, c.phone_no as customer_phone, c.address_line1 as customer_address
      FROM account a
      LEFT JOIN customer c ON a.customer_id = c.id
      WHERE a.account_no = $1
    `, [accountNo]);
    return res.rows[0] || null;
  },

  async getByCustomerId(customerId) {
    const res = await query(
      "SELECT * FROM account WHERE customer_id = $1",
      [customerId]
    );
    return res.rows;
  },

  async create({ account_no, open_date, status, current_balance, customer_id }) {
    let finalAccountNo = account_no;

    if (!finalAccountNo || finalAccountNo.trim() === "") {
      const nextIdResult = await query(`
        SELECT COALESCE(MAX(id), 0) + 1 AS next_id
        FROM account
      `);

      const nextId = Number(nextIdResult.rows[0].next_id);

      finalAccountNo = `ACC${String(nextId).padStart(3, "0")}`;
    }

    const existing = await query(
      "SELECT id FROM account WHERE account_no = $1",
      [finalAccountNo]
    );

    if (existing.rows.length > 0) {
      throw new Error(`Account number ${finalAccountNo} already exists`);
    }

    const res = await query(
      `INSERT INTO account (
        account_no,
        open_date,
        status,
        current_balance,
        customer_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        finalAccountNo,
        open_date,
        status || "Active",
        current_balance || 0,
        customer_id
      ]
    );

    return res.rows[0];
  },

  async update(id, { status, current_balance }) {
    const res = await query(
      `UPDATE account
       SET status = $1,
           current_balance = $2
       WHERE id = $3
       RETURNING *`,
      [status, current_balance, id]
    );

    return res.rows[0];
  },

  async updateBalance(id, amount, tx = null) {
    const executor = tx || { query };

    const res = await executor.query(
      `UPDATE account
       SET current_balance = current_balance + $1
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    return res.rows[0];
  },

  async delete(id) {
    await query(
      "DELETE FROM account WHERE id = $1",
      [id]
    );

    return true;
  }
};