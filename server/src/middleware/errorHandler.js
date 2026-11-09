import { sendError } from "../utils/response.js";

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Express Error Handler Captured Route Error:", err.stack || err);
  const status = err.status || 500;
  const message = err.message || "An internal database or server error occurred";
  return sendError(res, message, status);
};
export default errorHandler;
