import { Router } from "express";
import { ReportController } from "../controllers/reportController.js";

const router = Router();

router.get("/summary", ReportController.getDashboardSummary);
router.get("/:reportId", ReportController.getReport);

export default router;
