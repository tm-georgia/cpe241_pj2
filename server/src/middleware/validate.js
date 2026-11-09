import { sendError } from "../utils/response.js";

export const validateCustomer = (req, res, next) => {
  const { name, nrc_no, phone_no, address_line1, date_of_birth } = req.body;
  if (!name || !nrc_no || !phone_no || !address_line1 || !date_of_birth) {
    return sendError(res, "Missing key customer records (name, nrc_no, phone_no, address_line1, date_of_birth)", 400);
  }
  next();
};

export const validateAccount = (req, res, next) => {
  const { customer_id, current_balance } = req.body;
  if (!customer_id || current_balance === undefined) {
    return sendError(res, "Missing customer ID or initial balance", 400);
  }
  next();
};
