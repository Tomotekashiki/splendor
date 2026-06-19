import { Router } from "express";
import { AdminAuthController } from "../controllers/admin-auth.controller.js";

const router = Router();

router.post("/login", AdminAuthController.login);
router.get("/me", AdminAuthController.me);

export default router;
