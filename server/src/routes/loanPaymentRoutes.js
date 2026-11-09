import { Router } from "express";
import { LoanPaymentController } from "../controllers/loanPaymentController.js";

const router = Router();

router.get("/", LoanPaymentController.getPayments);
router.get("/:id", LoanPaymentController.getPaymentById);
router.post("/", LoanPaymentController.processPayment);

export default router;
