import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";

const router = Router();

router.get("/", SettingsController.getSettings);
router.put("/", SettingsController.updateSettings);
router.get("/calendar-overrides", SettingsController.getCalendarOverrides);
router.put("/calendar-overrides", SettingsController.toggleCalendarOverride);

export default router;
