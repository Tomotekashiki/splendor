import { Router } from "express";
import { AdminAuthController } from "../controllers/admin-auth.controller.js";

const router = Router();

router.post("/login", AdminAuthController.login);
router.get("/me", AdminAuthController.me);
router.post("/fcm-token", AdminAuthController.registerFcmToken);
router.delete("/fcm-token", AdminAuthController.removeFcmToken);
router.get("/messaging-stats", AdminAuthController.getMessagingStats);
router.post("/send-custom-push", AdminAuthController.sendCustomPush);
router.post("/upload-notification-image", AdminAuthController.uploadNotificationImage);

export default router;
