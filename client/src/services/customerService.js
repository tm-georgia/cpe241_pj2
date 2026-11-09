import axios from "axios";

const API_URL = "/api/customers";

export const customerService = {
  async getCustomers() {
    const res = await axios.get(API_URL);
    return res.data.data;
  },

  async getCustomerById(id) {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data.data;
  },

  async createCustomer(customerData) {
    const res = await axios.post(API_URL, customerData);
    return res.data.data;
  },

  async updateCustomer(id, customerData) {
    const res = await axios.put(`${API_URL}/${id}`, customerData);
    return res.data.data;
  },

  async deleteCustomer(id) {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data.data;
  }
};

export default customerService;
