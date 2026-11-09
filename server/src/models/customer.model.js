import { query } from "../config/database.js";

export const CustomerModel = {
  async getAll() {
    const res = await query("SELECT * FROM customer ORDER BY id DESC");
    return res.rows;
  },

  async getById(id) {
    const res = await query("SELECT * FROM customer WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async getByCode(code) {
    const res = await query("SELECT * FROM customer WHERE code = $1", [code]);
    return res.rows[0] || null;
  },

  async create({ code, name, nrc_no, phone_no, address_line1, address_line2, date_of_birth }) {
    const res = await query(
      `INSERT INTO customer (code, name, nrc_no, phone_no, address_line1, address_line2, date_of_birth) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, name, nrc_no, phone_no, address_line1, address_line2, date_of_birth]
    );
    return res.rows[0];
  },

  async update(id, { name, nrc_no, phone_no, address_line1, address_line2, date_of_birth }) {
    const res = await query(
      `UPDATE customer 
       SET name = $1, nrc_no = $2, phone_no = $3, address_line1 = $4, address_line2 = $5, date_of_birth = $6 
       WHERE id = $7 RETURNING *`,
      [name, nrc_no, phone_no, address_line1, address_line2, date_of_birth, id]
    );
    return res.rows[0];
  },

  async delete(id) {
    await query("DELETE FROM customer WHERE id = $1", [id]);
    return true;
  }
};
