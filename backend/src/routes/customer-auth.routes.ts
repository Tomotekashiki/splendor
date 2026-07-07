import { Router } from "express";
import { CustomerAuthController } from "../controllers/customer-auth.controller.js";

const router = Router();

router.post("/register", CustomerAuthController.register);
router.post("/login", CustomerAuthController.login);
router.get("/me", CustomerAuthController.me);
router.post("/forgot-password", CustomerAuthController.forgotPassword);
router.post("/reset-password", CustomerAuthController.resetPassword);
router.put("/update-profile", CustomerAuthController.updateProfile);
router.post("/fcm-token", CustomerAuthController.registerFcmToken);
router.delete("/fcm-token", CustomerAuthController.removeFcmToken);

export default router;
