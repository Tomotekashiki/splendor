import { Router } from "express";
import { CustomerAuthController } from "../controllers/customer-auth.controller.js";

const router = Router();

router.post("/register", CustomerAuthController.register);
router.post("/login", CustomerAuthController.login);
router.get("/me", CustomerAuthController.me);
router.post("/forgot-password", CustomerAuthController.forgotPassword);
router.post("/reset-password", CustomerAuthController.resetPassword);
router.put("/update-profile", CustomerAuthController.updateProfile);

export default router;
