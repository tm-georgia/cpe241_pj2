import { AccountModel } from "../models/account.model.js";
import { query, getTransaction } from "../config/database.js";

export const AccountService = {
  async listAccounts() {
    return await AccountModel.getAll();
  },

  async getAccount(id) {
    const account = await AccountModel.getById(id);
    if (!account) return null;

    // Fetch account charges including joined charge_item and line description
    const chargesRes = await query(`
      SELECT ac.id, ac.code, ac.date, ci.charge_type, ci.charge_amount, li.description
      FROM account_charge ac
      LEFT JOIN charge_item ci ON ac.charge_id = ci.id
      LEFT JOIN account_charge_line_item li ON li.account_charge_id = ac.id AND li.account_id = ac.account_id
      WHERE ac.account_id = $1
      ORDER BY ac.date DESC, ac.id DESC
    `, [id]);

    return {
      ...account,
      charges: chargesRes.rows
    };
  },

async createAccount(accountData) {
  return await AccountModel.create(accountData);
},

  async updateAccount(id, updateData) {
    return await AccountModel.update(id, updateData);
  },

  async deleteAccount(id) {
    return await AccountModel.delete(id);
  },

  // Apply Account Charges header and line items in a secure transaction
  async applyAccountCharges({ accountNo, chargeId, date, lines }) {
    const tx = await getTransaction();
    try {
      // Find account
      const accRes = await tx.query("SELECT * FROM account WHERE account_no = $1", [accountNo]);
      const account = accRes.rows[0];
      if (!account) {
        throw new Error("Account not found");
      }

      // Create main account charge header
      const chargeCountRes = await tx.query("SELECT COUNT(*) FROM account_charge");
      const nextChargeNum = Number(chargeCountRes.rows[0].count) + 1;
      const chargeCode = `ACHG-${String(nextChargeNum).padStart(3, '0')}`;

      const headerRes = await tx.query(
        `INSERT INTO account_charge (code, date, account_id, charge_id) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [chargeCode, date || new Date().toISOString().split("T")[0], account.id, chargeId || null]
      );
      const chargeHeader = headerRes.rows[0];

      // Save each charge line item and deduct from account balance
      let totalDeduction = 0;
      for (const line of lines) {
        const amt = Number(line.charge_amount) || 0;
        totalDeduction += amt;

        // Insert line item (Customer side debit)
        await tx.query(
          `INSERT INTO account_charge_line_item (account_id, account_charge_id, description, date)
           VALUES ($1, $2, $3, $4)`,
          [account.id, chargeHeader.id, line.description || "Service charge applied", date || new Date().toISOString().split("T")[0]]
        );

        // Insert line item (Bank side credit)
        await tx.query(
          `INSERT INTO account_charge_line_item (account_id, account_charge_id, description, date)
           VALUES ($1, $2, $3, $4)`,
          [99, chargeHeader.id, "Bank Received: " + (line.description || "Service charge applied"), date || new Date().toISOString().split("T")[0]]
        );
      }

      // Deduct total charge amount from current account balance
      await tx.query(
        `UPDATE account SET current_balance = current_balance - $1 WHERE id = $2`,
        [totalDeduction, account.id]
      );

      // Credit bank revenue account balance (id = 99)
      await tx.query(
        `UPDATE account SET current_balance = current_balance + $1 WHERE id = $2`,
        [totalDeduction, 99]
      );

      await tx.commit();
      return {
        header: chargeHeader,
        totalDeduction,
        newBalance: account.current_balance - totalDeduction
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // Get charge item types
  async getChargeItems() {
    const res = await query("SELECT * FROM charge_item ORDER BY id ASC");
    return res.rows;
  }
};
