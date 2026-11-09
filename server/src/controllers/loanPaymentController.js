import { PaymentService } from "../services/paymentService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const LoanPaymentController = {
  async getPayments(req, res) {
    try {
      const data = await PaymentService.listPayments();
      return sendSuccess(res, data, "Loan payments retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getPaymentById(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await PaymentService.getPaymentDetail(id);
      if (!data) return sendError(res, "Payment details not found", 404);
      return sendSuccess(res, data, "Payment logs and receipt loaded");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async processPayment(req, res) {
    try {
      const { loan_id, payment_date, lines } = req.body;
      if (!loan_id || !lines || lines.length === 0) {
        return sendError(res, "Missing loan, payment date, or schedule payment details", 400);
      }
      const data = await PaymentService.processPayment({ loan_id, payment_date, lines });
      return sendSuccess(res, data, "Payment processed successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
