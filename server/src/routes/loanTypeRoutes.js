import { Router } from "express";
import { LoanController } from "../controllers/loanController.js";

const router = Router();

router.get("/", LoanController.getLoanTypes);

export default router;
