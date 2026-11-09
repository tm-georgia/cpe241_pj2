import { LoanService } from "../services/loanService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { query } from "../config/database.js";

export const LoanDisbursementController = {
  async getDisbursements(req, res) {
    try {
      const result = await query(`
        SELECT d.*, l.code as loan_code, c.name as customer_name
        FROM loan_disbursement_line_item d
        LEFT JOIN loan l ON d.loan_id = l.id
        LEFT JOIN customer c ON l.customer_id = c.id
        ORDER BY d.id DESC
      `);
      return sendSuccess(res, result.rows, "Disbursements retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getDisbursementById(req, res) {
    try {
      const id = Number(req.params.id);
      const mainRes = await query(`
        SELECT d.*, l.code as loan_code, c.name as customer_name, c.phone_no as customer_phone, c.address_line1 as customer_address,
               a.account_no, lt.type_name as loan_type, l.loan_amount, l.outstanding_balance
        FROM loan_disbursement_line_item d
        LEFT JOIN loan l ON d.loan_id = l.id
        LEFT JOIN customer c ON l.customer_id = c.id
        LEFT JOIN account a ON l.account_id = a.id
        LEFT JOIN loan_type lt ON l.loan_type_id = lt.id
        WHERE d.id = $1
      `, [id]);

      if (mainRes.rows.length === 0) return sendError(res, "Disbursement record not found", 404);
      
      const record = mainRes.rows[0];
      // Simulated single line items for display matching detail view
      const lines = [
        { no: 1, disbursement_date: record.disbursement_date, disbursement_amount: record.disbursement_amount }
      ];

      return sendSuccess(res, { ...record, lines }, "Disbursement details retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async createDisbursement(req, res) {
    try {
      const { loan_id, lines } = req.body;
      if (!loan_id || !lines || lines.length === 0) {
        return sendError(res, "Missing loan ID or disbursement line items", 400);
      }
      const data = await LoanService.createDisbursement({ loan_id, lines });
      return sendSuccess(res, data, "Disbursement processed successfully and linked account credited", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
