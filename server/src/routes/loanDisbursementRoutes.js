import { Router } from "express";
import { LoanDisbursementController } from "../controllers/loanDisbursementController.js";

const router = Router();

router.get("/", LoanDisbursementController.getDisbursements);
router.get("/:id", LoanDisbursementController.getDisbursementById);
router.post("/", LoanDisbursementController.createDisbursement);

export default router;
