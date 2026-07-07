import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
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

  static async getMessagingStats(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }

      const adminTokensObj = await fb.get("admin_fcm_tokens") || {};
      const customerTokensObj = await fb.get("customer_fcm_tokens") || {};

      const adminCount = Object.keys(adminTokensObj).length;
      const customerCount = Object.keys(customerTokensObj).length;

      return res.status(200).json({
        success: true,
        adminCount,
        customerCount,
        totalCount: adminCount + customerCount,
      });
    } catch (error: any) {
      console.error("Get messaging stats error:", error);
      return res.status(500).json({ error: "Failed to get messaging statistics." });
    }
  }

  static async sendCustomPush(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }

      const { title, body, imageUrl, target } = req.body;
      if (!title || typeof title !== "string" || !body || typeof body !== "string") {
        return res.status(400).json({ error: "Title and body are required and must be strings." });
      }

      const targetGroup = target || "all"; // "all" | "admins" | "customers"

      let tokens: string[] = [];

      if (targetGroup === "admins" || targetGroup === "all") {
        const adminTokensObj = await fb.get("admin_fcm_tokens") || {};
        tokens.push(...(Object.values(adminTokensObj) as string[]));
      }

      if (targetGroup === "customers" || targetGroup === "all") {
        const customerTokensObj = await fb.get("customer_fcm_tokens") || {};
        tokens.push(...(Object.values(customerTokensObj) as string[]));
      }

      // Filter out duplicate tokens and empty strings
      tokens = Array.from(new Set(tokens)).filter(t => typeof t === "string" && t.trim().length > 0);

      if (tokens.length === 0) {
        return res.status(200).json({ 
          success: true, 
          message: "No registered devices found for the target group.", 
          sentCount: 0,
          successCount: 0,
          failureCount: 0
        });
      }

      const { default: admin } = await import("firebase-admin");

      const payload: any = {
        notification: {
          title,
          body,
        },
        tokens,
      };

      if (imageUrl && typeof imageUrl === "string" && imageUrl.trim().length > 0) {
        payload.notification.image = imageUrl.trim();
      }

      console.log(`📡 Broadcast sending FCM custom push to ${tokens.length} target devices...`);
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`✉️ FCM Broadcast complete. Success: ${response.successCount}, Failure: ${response.failureCount}`);

      // Clean up invalid/expired tokens
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (error && (
              error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered'
            )) {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          console.log(`🧹 Cleaning up ${tokensToRemove.length} expired custom FCM tokens...`);
          // Clean up from admin tokens
          const adminTokensObj = await fb.get("admin_fcm_tokens") || {};
          for (const key of Object.keys(adminTokensObj)) {
            if (tokensToRemove.includes(adminTokensObj[key])) {
              await fb.remove(`admin_fcm_tokens/${key}`);
            }
          }
          // Clean up from customer tokens
          const customerTokensObj = await fb.get("customer_fcm_tokens") || {};
          for (const key of Object.keys(customerTokensObj)) {
            if (tokensToRemove.includes(customerTokensObj[key])) {
              await fb.remove(`customer_fcm_tokens/${key}`);
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Push notifications broadcasted successfully.",
        sentCount: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    } catch (error: any) {
      console.error("Send custom push error:", error);
      return res.status(500).json({ error: "Failed to send push notifications." });
    }
  }

  static async uploadNotificationImage(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing or invalid." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }

      const { fileName, fileData } = req.body;
      if (!fileName || !fileData || typeof fileData !== "string") {
        return res.status(400).json({ error: "FileName and fileData (Base64 string) are required." });
      }

      // Check format
      const match = fileData.match(/^data:image\/(\w+);base64,/);
      if (!match) {
        return res.status(400).json({ error: "Invalid image format. Must be a base64 image string." });
      }

      const ext = match[1];
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uniqueName = `${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);
      
      fs.writeFileSync(filePath, buffer);

      // Build public URL
      const host = req.get("host") || "localhost:4000";
      // Determine protocol
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const publicUrl = `${protocol}://${host}/uploads/${uniqueName}`;

      console.log(`💾 Image uploaded and saved to: ${filePath} -> Public URL: ${publicUrl}`);

      return res.status(200).json({
        success: true,
        imageUrl: publicUrl,
      });
    } catch (err: any) {
      console.error("Image upload error:", err);
      return res.status(500).json({ error: "Failed to upload image." });
    }
  }
}

