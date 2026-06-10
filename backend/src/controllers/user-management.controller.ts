import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import { User } from "../models/types.js";
import { hashPassword, verifyToken } from "../services/password.service.js";
import { z } from "zod";
import crypto from "crypto";

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(3),
  role: z.enum(["admin", "manager"]),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(3).optional(),
  role: z.enum(["admin", "manager"]).optional(),
});

// Helper to check if request is authorized as admin
function getAdminUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export class UserManagementController {
  static async list(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      let allUsers: any[] = [];
      try {
        const usersObj = await fb.get("users") || {};
        const usersList = Object.values(usersObj) as User[];
        allUsers = usersList.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          createdAt: u.createdAt,
        }));
      } catch (dbError) {
        console.error("Database query failed during user listing:", dbError);
        return res.status(503).json({
          error: "Database connection failed. Please fall back to local offline mode.",
          code: "DATABASE_OFFLINE"
        });
      }

      return res.status(200).json({ success: true, users: allUsers });
    } catch (error: any) {
      console.error("List users error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters. Username and password must be at least 3 characters." });
      }

      const { username, password, role } = parsed.data;

      try {
        const usersObj = await fb.get("users") || {};
        const usersList = Object.values(usersObj) as User[];
        const nameExists = usersList.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (nameExists) {
          return res.status(400).json({ error: "Username already exists." });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const passwordHash = hashPassword(password);
        const newUser: User = {
          id,
          username,
          passwordHash,
          role,
          createdAt: now,
          updatedAt: now,
        };

        await fb.set(`users/${id}`, newUser);

        const returnedUser = {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        };

        return res.status(201).json({ success: true, user: returnedUser });
      } catch (dbError: any) {
        console.error("Database error during user creation:", dbError);
        return res.status(503).json({
          error: "Database connection failed. Please fall back to local offline mode.",
          code: "DATABASE_OFFLINE"
        });
      }
    } catch (error: any) {
      console.error("Create user error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const { id } = req.params;
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters." });
      }

      const existingUser = await fb.get(`users/${id}`) as User | null;
      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      const updateData: any = {};
      if (parsed.data.username) {
        const username = parsed.data.username;
        // Unique check excluding self
        const usersObj = await fb.get("users") || {};
        const usersList = Object.values(usersObj) as User[];
        const nameConflict = usersList.some(u => u.id !== id && u.username.toLowerCase() === username.toLowerCase());
        if (nameConflict) {
          return res.status(400).json({ error: "Username already exists." });
        }
        updateData.username = username;
      }
      if (parsed.data.password) updateData.passwordHash = hashPassword(parsed.data.password);
      if (parsed.data.role) updateData.role = parsed.data.role;
      updateData.updatedAt = new Date().toISOString();

      try {
        await fb.update(`users/${id}`, updateData);

        const updated = await fb.get(`users/${id}`) as User;
        const returnedUser = {
          id: updated.id,
          username: updated.username,
          role: updated.role,
          createdAt: updated.createdAt,
        };

        return res.status(200).json({ success: true, user: returnedUser });
      } catch (dbError: any) {
        console.error("Database error during user update:", dbError);
        return res.status(503).json({
          error: "Database connection failed. Please fall back to local offline mode.",
          code: "DATABASE_OFFLINE"
        });
      }
    } catch (error: any) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const { id } = req.params;

      try {
        const user = await fb.get(`users/${id}`) as User | null;
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        await fb.remove(`users/${id}`);

        return res.status(200).json({ success: true, message: "User deleted successfully." });
      } catch (dbError: any) {
        console.error("Database error during user deletion:", dbError);
        return res.status(503).json({
          error: "Database connection failed. Please fall back to local offline mode.",
          code: "DATABASE_OFFLINE"
        });
      }
    } catch (error: any) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}

