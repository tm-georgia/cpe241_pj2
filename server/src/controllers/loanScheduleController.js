import { LoanScheduleModel } from "../models/loanSchedule.model.js";
import { LoanService } from "../services/loanService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { query } from "../config/database.js";

export const LoanScheduleController = {
  async getSchedules(req, res) {
    try {
      const result = await query(`
        SELECT s.*, s.amount_due as amount_to_be_paid_back, l.code as loan_code
        FROM loan_schedule s
        LEFT JOIN loan l ON s.loan_id = l.id
        ORDER BY s.id DESC
      `);
      return sendSuccess(res, result.rows, "Payment schedules retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getSchedulesByLoan(req, res) {
    try {
      const loanId = Number(req.params.loanId);
      const data = await LoanScheduleModel.getByLoanId(loanId);
      return sendSuccess(res, data, "Schedules for loan retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async createManualSchedules(req, res) {
    try {
      const { loan_id, schedules } = req.body;
      if (!loan_id || !schedules || schedules.length === 0) {
        return sendError(res, "Missing loan_id or schedules lines", 400);
      }
      const data = await LoanService.createManualSchedules({ loan_id, schedules });
      return sendSuccess(res, data, "Manual schedules initialized successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
