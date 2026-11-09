import { Router } from "express";
import { LoanScheduleController } from "../controllers/loanScheduleController.js";

const router = Router();

router.get("/", LoanScheduleController.getSchedules);
router.get("/loan/:loanId", LoanScheduleController.getSchedulesByLoan);
router.post("/manual", LoanScheduleController.createManualSchedules);

export default router;
