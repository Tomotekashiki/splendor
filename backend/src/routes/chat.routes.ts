import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";

const router = Router();

router.post("/message", ChatController.proxyWitMessage);

export default router;
