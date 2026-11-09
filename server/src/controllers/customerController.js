import { CustomerService } from "../services/customerService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const CustomerController = {
  async getCustomers(req, res) {
    try {
      const data = await CustomerService.listCustomers();
      return sendSuccess(res, data, "Customers retrieved successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async getCustomerById(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await CustomerService.getCustomerDetail(id);
      if (!data) return sendError(res, "Customer not found", 404);
      return sendSuccess(res, data, "Customer detail retrieved");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async createCustomer(req, res) {
    try {
      const data = await CustomerService.createCustomer(req.body);
      return sendSuccess(res, data, "Customer created successfully", 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async updateCustomer(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await CustomerService.updateCustomer(id, req.body);
      return sendSuccess(res, data, "Customer updated successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  },

  async deleteCustomer(req, res) {
    try {
      const id = Number(req.params.id);
      await CustomerService.deleteCustomer(id);
      return sendSuccess(res, null, "Customer deleted successfully");
    } catch (err) {
      return sendError(res, err.message);
    }
  }
};
