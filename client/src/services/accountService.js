import axios from "axios";

const API_URL = "/api/accounts";

export const accountService = {
  async getAccounts() {
    const res = await axios.get(API_URL);
    return res.data.data;
  },

  async getAccountById(id) {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data.data;
  },

  async createAccount(accountData) {
    const res = await axios.post(API_URL, accountData);
    return res.data.data;
  },

  async applyCharges({ accountNo, chargeId, date, lines }) {
    const res = await axios.post(`${API_URL}/apply-charges`, { accountNo, chargeId, date, lines });
    return res.data.data;
  },

  async getChargeItems() {
    const res = await axios.get(`${API_URL}/charge-items`);
    return res.data.data;
  }
};

export default accountService;
