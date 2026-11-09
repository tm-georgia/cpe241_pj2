import { TransactionService } from "../services/transactionService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const TransactionController = {
  async getTransactions(req, res) {
    try {
      const data = await TransactionService.listTransactions();
      return sendSuccess(res, data, "Transactions list retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getTransactionById(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await TransactionService.getTransactionDetail(id);
      if (!data) return sendError(res, "Transaction not found", 404);
      return sendSuccess(res, data, "Transaction detail retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async processSingleTransfer(req, res) {
    try {
      const { fromAccountNo, toAccountNo, amount, date, remark } = req.body;
      if (!fromAccountNo || !toAccountNo || !amount) {
        return sendError(res, "Missing source account, destination account, or amount details", 400);
      }
      const data = await TransactionService.processSingleTransfer({ fromAccountNo, toAccountNo, amount, date, remark });
      return sendSuccess(res, data, "Single external transfer completed", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async processPayrollTransfer(req, res) {
    try {
      const { fromAccountNo, date, remark, destinations } = req.body;
      if (!fromAccountNo || !destinations || destinations.length === 0) {
        return sendError(res, "Missing source account or employee distribution details", 400);
      }
      const data = await TransactionService.processPayrollTransfer({ fromAccountNo, date, remark, destinations });
      return sendSuccess(res, data, "Payroll batch distribution completed", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async processDeposit(req, res) {
    try {
      const { accountNo, amount, date, remark } = req.body;
      if (!accountNo || !amount) {
        return sendError(res, "Missing deposit account number or amount", 400);
      }
      const data = await TransactionService.processDeposit({ accountNo, amount, date, remark });
      return sendSuccess(res, data, "Deposit completed successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async processWithdrawal(req, res) {
    try {
      const { accountNo, amount, date, remark } = req.body;
      if (!accountNo || !amount) {
        return sendError(res, "Missing withdrawal account number or amount", 400);
      }
      const data = await TransactionService.processWithdrawal({ accountNo, amount, date, remark });
      return sendSuccess(res, data, "Withdrawal completed successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
