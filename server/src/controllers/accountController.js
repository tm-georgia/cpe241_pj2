import { AccountService } from "../services/accountService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const AccountController = {
  async getAccounts(req, res) {
    try {
      const data = await AccountService.listAccounts();
      return sendSuccess(res, data, "Accounts retrieved successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getAccountById(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await AccountService.getAccount(id);
      if (!data) return sendError(res, "Account not found", 404);
      return sendSuccess(res, data, "Account detail retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async createAccount(req, res) {
    try {
      const data = await AccountService.createAccount(req.body);
      return sendSuccess(res, data, "Account created successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async updateAccount(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await AccountService.updateAccount(id, req.body);
      return sendSuccess(res, data, "Account updated successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async deleteAccount(req, res) {
    try {
      const id = Number(req.params.id);
      await AccountService.deleteAccount(id);
      return sendSuccess(res, null, "Account deleted successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async applyCharges(req, res) {
    try {
      const { accountNo, chargeId, date, lines } = req.body;
      if (!accountNo || !lines || lines.length === 0) {
        return sendError(res, "Missing account number or line items to charge", 400);
      }
      const data = await AccountService.applyAccountCharges({ accountNo, chargeId, date, lines });
      return sendSuccess(res, data, "Charges applied and deducted successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getChargeItems(req, res) {
    try {
      const data = await AccountService.getChargeItems();
      return sendSuccess(res, data, "Charge types list retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
