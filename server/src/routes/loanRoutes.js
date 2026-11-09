import { Router } from "express";
import { LoanController } from "../controllers/loanController.js";

const router = Router();

router.get("/", LoanController.getLoans);
router.get("/:id", LoanController.getLoanById);
router.post("/", LoanController.createLoan);

export default router;
