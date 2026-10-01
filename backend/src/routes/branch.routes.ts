import { Router } from "express";
import { BranchController } from '../controllers/branch.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get("/", BranchController.list);
router.post("/", requireAdmin, BranchController.create);
router.put("/reorder", requireAdmin, BranchController.reorderBranches);
router.patch("/:id", requireAdmin, BranchController.update);
router.delete("/:id", requireAdmin, BranchController.delete);

export default router;
