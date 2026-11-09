import { ReportService } from "../services/reportService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const ReportController = {
  async getDashboardSummary(req, res) {
    try {
      const stats = await ReportService.getGeneralStats();
      const portfolios = await ReportService.getLoanPortfolioStats();
      const txnStats = await ReportService.getRecentTransactionStats();
      const metrics = await ReportService.getDashboardSummaryMetrics();

      return sendSuccess(res, {
        stats,
        portfolios,
        transactions: txnStats,
        ...metrics
      }, "Dashboard reports summaries loaded");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getReport(req, res) {
    try {
      const { reportId } = req.params;
      const filters = req.query; // { page, limit, sortBy, sortOrder, fromDate, toDate, topN, loanCode, loanStatus, accountStatus, accountCode, customerName, asOfDate, transactionType }

      const reportResponse = await ReportService.getReportData(reportId, filters);

      return sendSuccess(
        res,
        reportResponse,
        `Report ${reportId} loaded successfully`
      );
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
