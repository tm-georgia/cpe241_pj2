import axios from "axios";

export const reportService = {
  async getSummary() {
    const res = await axios.get("/api/reports/summary");
    return res.data.data;
  },

  async getReport(reportId, filters = {}) {
    const res = await axios.get(`/api/reports/${reportId}`, { params: filters });
    return res.data?.data || res.data || {};
  }
};

export default reportService;
