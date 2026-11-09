import { Router } from "express";
import { AccountController } from "../controllers/accountController.js";

const router = Router();

router.get("/", AccountController.getChargeItems);
router.post("/apply", AccountController.applyCharges);

export default router;
