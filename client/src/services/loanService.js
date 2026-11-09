import axios from "axios";

export const loanService = {
  // Loans
  async getLoans() {
    const res = await axios.get("/api/loans");
    return res.data.data;
  },

  async getLoanById(id) {
    const res = await axios.get(`/api/loans/${id}`);
    return res.data.data;
  },

  async createLoan(loanData) {
    const res = await axios.post("/api/loans", loanData);
    return res.data.data;
  },

  async getLoanTypes() {
    const res = await axios.get("/api/loan-types");
    return res.data.data;
  },

  // Disbursements
  async getDisbursements() {
    const res = await axios.get("/api/disbursements");
    return res.data.data;
  },

  async getDisbursementById(id) {
    const res = await axios.get(`/api/disbursements/${id}`);
    return res.data.data;
  },

  async createDisbursement({ loan_id, lines }) {
    const res = await axios.post("/api/disbursements", { loan_id, lines });
    return res.data.data;
  },

  // Schedules
  async getSchedules() {
    const res = await axios.get("/api/schedules");
    return res.data.data;
  },

  async getSchedulesByLoan(loanId) {
    const res = await axios.get(`/api/schedules/loan/${loanId}`);
    return res.data.data;
  },

  async createManualSchedules({ loan_id, schedules }) {
    const res = await axios.post("/api/schedules/manual", { loan_id, schedules });
    return res.data.data;
  },

  // Payments
  async getPayments() {
    const res = await axios.get("/api/payments");
    return res.data.data;
  },

  async getPaymentById(id) {
    const res = await axios.get(`/api/payments/${id}`);
    return res.data.data;
  },

  async processRepayment({ loan_id, payment_date, lines }) {
    const res = await axios.post("/api/payments", { loan_id, payment_date, lines });
    return res.data.data;
  }
};

export default loanService;
