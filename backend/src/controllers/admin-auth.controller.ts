import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import { verifyPassword, generateToken, verifyToken } from "../services/password.service.js";
import { User } from "../models/types.js";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Username and password must be at least 3 characters." });
      }

      const { username, password } = parsed.data;

      // Find user in Firebase
      let user: User | undefined;
      try {
        const usersObj = await fb.get("users") || {};
        const usersList = Object.values(usersObj) as User[];
        user = usersList.find(u => u.username === username);
      } catch (dbError: any) {
        console.error("Firebase query failed during admin login:", dbError);
        return res.status(503).json({
          error: "Database connection failed. Please fall back to local offline mode.",
          code: "DATABASE_OFFLINE"
        });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const isPasswordCorrect = verifyPassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      // Generate JWT
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Admin login error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }

      // Optional check in DB, but if DB is offline, we can trust the signed JWT payload
      try {
        const user = await fb.get(`users/${decoded.id}`) as User | null;
        if (user) {
          return res.status(200).json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
            },
          });
        }
      } catch (dbError) {
        console.warn("Database offline during session verification, using decoded JWT payload:", dbError);
      }

      // Fallback: return decoded token data since token signature is verified
      return res.status(200).json({
        success: true,
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
        },
      });
    } catch (error: any) {
      console.error("Session verification error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async registerFcmToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }

      const { fcmToken } = req.body;
      if (!fcmToken || typeof fcmToken !== "string") {
        return res.status(400).json({ error: "Invalid FCM token parameter." });
      }

      // Save token in DB using the Admin SDK capability of fb wrapper
      await fb.set(`admin_fcm_tokens/${decoded.id}`, fcmToken);
      console.log(`✅ FCM token registered in Firebase DB for user ${decoded.id} via backend API`);
      return res.status(200).json({ success: true, message: "FCM token registered successfully." });
    } catch (error: any) {
      console.error("Register FCM token error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async removeFcmToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }

      // Remove token from DB
      await fb.remove(`admin_fcm_tokens/${decoded.id}`);
      console.log(`🗑️ FCM token removed from Firebase DB for user ${decoded.id} via backend API`);
      return res.status(200).json({ success: true, message: "FCM token removed successfully." });
    } catch (error: any) {
      console.error("Remove FCM token error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}

