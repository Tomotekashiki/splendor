import { Router } from "express";
import { UserManagementController } from "../controllers/user-management.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAdmin);

router.get("/", UserManagementController.list);
router.post("/", UserManagementController.create);
router.patch("/:id", UserManagementController.update);
router.delete("/:id", UserManagementController.delete);

export default router;
