import { Router } from "express";
import { AccountController } from "../controllers/accountController.js";

const router = Router();

router.get("/", AccountController.getAccounts);
router.get("/charge-items", AccountController.getChargeItems);
router.post("/apply-charges", AccountController.applyCharges);
router.get("/:id", AccountController.getAccountById);
router.post("/", AccountController.createAccount);
router.put("/:id", AccountController.updateAccount);
router.delete("/:id", AccountController.deleteAccount);

export default router;
