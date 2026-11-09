import { Router } from "express";
import { CustomerController } from "../controllers/customerController.js";
import { validateCustomer } from "../middleware/validate.js";

const router = Router();

router.get("/", CustomerController.getCustomers);
router.get("/:id", CustomerController.getCustomerById);
router.post("/", validateCustomer, CustomerController.createCustomer);
router.put("/:id", validateCustomer, CustomerController.updateCustomer);
router.delete("/:id", CustomerController.deleteCustomer);

export default router;
