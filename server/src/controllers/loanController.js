import { LoanService } from "../services/loanService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const LoanController = {
  async getLoans(req, res) {
    try {
      const data = await LoanService.listLoans();
      return sendSuccess(res, data, "Loans retrieved successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getLoanById(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await LoanService.getLoanDetail(id);
      if (!data) return sendError(res, "Loan not found", 404);
      return sendSuccess(res, data, "Loan detail retrieved successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async createLoan(req, res) {
    try {
      const { account_no, loan_type_id, loan_amount, loan_term, interest_rate, start_date, status } = req.body;
      if (!account_no || !loan_type_id || !loan_amount || !loan_term || !start_date) {
        return sendError(res, "Missing required criteria for loan generation", 400);
      }
      const data = await LoanService.createLoan({ account_no, loan_type_id, loan_amount, loan_term, interest_rate, start_date, status });
      return sendSuccess(res, data, "Loan created and payment schedules pre-calculated", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getLoanTypes(req, res) {
    try {
      const data = await LoanService.getLoanTypes();
      return sendSuccess(res, data, "Loan types retrieved successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
