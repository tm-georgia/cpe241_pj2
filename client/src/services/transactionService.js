import axios from "axios";

const API_URL = "/api/transactions";

export const transactionService = {
  async getTransactions() {
    const res = await axios.get(API_URL);
    return res.data.data;
  },

  async getTransactionById(id) {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data.data;
  },

  async singleTransfer(payload) {
    const res = await axios.post(`${API_URL}/single-transfer`, payload);
    return res.data.data;
  },

  async payrollTransfer(payload) {
    const res = await axios.post(`${API_URL}/payroll-transfer`, payload);
    return res.data.data;
  },

  async deposit(payload) {
    const res = await axios.post(`${API_URL}/deposit`, payload);
    return res.data.data;
  },

  async withdrawal(payload) {
    const res = await axios.post(`${API_URL}/withdrawal`, payload);
    return res.data.data;
  }
};

export default transactionService;
