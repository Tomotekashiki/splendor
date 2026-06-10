import { Router } from "express";
import { BranchController } from '../controllers/branch.controller.js';

const router = Router();

router.get("/", BranchController.list);
router.post("/", BranchController.create);
router.patch("/:id", BranchController.update);
router.delete("/:id", BranchController.delete);

export default router;
