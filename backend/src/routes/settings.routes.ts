import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAdmin);

router.get("/", SettingsController.getSettings);
router.put("/", SettingsController.updateSettings);
router.get("/calendar-overrides", SettingsController.getCalendarOverrides);
router.put("/calendar-overrides", SettingsController.toggleCalendarOverride);
router.post("/sync-vehicles", SettingsController.syncVehicles);

export default router;
