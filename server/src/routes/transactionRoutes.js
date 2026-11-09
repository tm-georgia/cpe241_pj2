import { Router } from "express";
import { TransactionController } from "../controllers/transactionController.js";

const router = Router();

router.get("/", TransactionController.getTransactions);
router.get("/:id", TransactionController.getTransactionById);
router.post("/single-transfer", TransactionController.processSingleTransfer);
router.post("/payroll-transfer", TransactionController.processPayrollTransfer);
router.post("/deposit", TransactionController.processDeposit);
router.post("/withdrawal", TransactionController.processWithdrawal);

export default router;
