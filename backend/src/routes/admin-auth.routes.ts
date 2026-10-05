import express, { Router } from "express";
import { AdminAuthController } from "../controllers/admin-auth.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", AdminAuthController.login);
router.get("/me", requireAuth, AdminAuthController.me);
router.post("/fcm-token", requireAuth, AdminAuthController.registerFcmToken);
router.delete("/fcm-token", requireAuth, AdminAuthController.removeFcmToken);
router.get("/messaging-stats", requireAdmin, AdminAuthController.getMessagingStats);
router.post("/send-custom-push", requireAdmin, AdminAuthController.sendCustomPush);
router.post(
  "/upload-notification-image",
  requireAdmin,
  express.json({ limit: "10mb" }),
  AdminAuthController.uploadNotificationImage
);

export default router;
