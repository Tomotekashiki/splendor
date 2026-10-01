import { Router } from "express";
import { ServiceController } from '../controllers/service.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get("/", ServiceController.getServiceGrid);
router.post("/", requireAdmin, ServiceController.createService);
router.put("/reorder", requireAdmin, ServiceController.reorderServices);
router.patch("/:id", requireAdmin, ServiceController.updateService);
router.delete("/:id", requireAdmin, ServiceController.deleteService);

export default router;
