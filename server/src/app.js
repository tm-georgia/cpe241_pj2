import express from "express";
import errorHandler from "./middleware/errorHandler.js";

// Import Routes
import customerRoutes from "./routes/customerRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import chargeRoutes from "./routes/chargeRoutes.js";
import loanTypeRoutes from "./routes/loanTypeRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import loanDisbursementRoutes from "./routes/loanDisbursementRoutes.js";
import loanScheduleRoutes from "./routes/loanScheduleRoutes.js";
import loanPaymentRoutes from "./routes/loanPaymentRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(express.json());

// API Prefix Routing
app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/charges", chargeRoutes);
app.use("/api/loan-types", loanTypeRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/disbursements", loanDisbursementRoutes);
app.use("/api/schedules", loanScheduleRoutes);
app.use("/api/payments", loanPaymentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "BankCore Backend" });
});

// Centralized Error Handling Middlewares (MUST be last)
app.use(errorHandler);

export default app;
