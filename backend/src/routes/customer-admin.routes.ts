import { Router } from "express";
import { CustomerAdminController } from "../controllers/customer-admin.controller.js";
import { requireAdminOrManager } from "../middleware/auth.middleware.js";

const router = Router();

router.patch("/:id/block", requireAdminOrManager, CustomerAdminController.toggleBlock);

export default router;
