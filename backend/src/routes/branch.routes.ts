import { Router } from "express";
import { BranchController } from '../controllers/branch.controller.js';

const router = Router();

router.get("/", BranchController.list);
router.post("/", BranchController.create);
router.put("/reorder", BranchController.reorderBranches);
router.patch("/:id", BranchController.update);
router.delete("/:id", BranchController.delete);

export default router;
