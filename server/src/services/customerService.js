import { CustomerModel } from "../models/customer.model.js";
import { AccountModel } from "../models/account.model.js";

export const CustomerService = {
  async listCustomers() {
    return await CustomerModel.getAll();
  },

  async getCustomerDetail(id) {
    const customer = await CustomerModel.getById(id);
    if (!customer) return null;
    const accounts = await AccountModel.getByCustomerId(id);
    return {
      ...customer,
      accounts
    };
  },

  async createCustomer(customerData) {
    // Generate code automatically
    const customers = await CustomerModel.getAll();
    customerData.code = `C${String(customers.length + 1).padStart(3, '0')}`;
    return await CustomerModel.create(customerData);
  },

  async updateCustomer(id, customerData) {
    return await CustomerModel.update(id, customerData);
  },

  async deleteCustomer(id) {
    return await CustomerModel.delete(id);
  }
};
