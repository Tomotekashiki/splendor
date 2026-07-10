import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";

const router = Router();

router.get("/calendar-overrides", SettingsController.getPublicCalendarOverrides);
router.get("/configured-hours", SettingsController.getPublicConfiguredHours);
router.get("/vehicles/makes", SettingsController.getPublicMakes);
router.get("/vehicles/models", SettingsController.getPublicModels);

export default router;
