import { Router } from "express";
import { CustomerAdminController } from "../controllers/customer-admin.controller.js";

const router = Router();

router.patch("/:id/block", CustomerAdminController.toggleBlock);

export default router;
