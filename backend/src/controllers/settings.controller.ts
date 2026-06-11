import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import { verifyToken } from "../services/password.service.js";
import { z } from "zod";

const updateSettingsSchema = z.object({
  smsGatewayKey: z.string().min(1, "SMS Office API key cannot be empty"),
  smsSenderName: z.string().min(1, "SMS Sender Name cannot be empty"),
  configuredHours: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).optional(),
});

const toggleOverrideSchema = z.object({
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD"),
  status: z.enum(["working", "non_working"]),
});

function getAdminUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      try {
        const settings = await fb.get("settings") || {};
        return res.status(200).json({
          success: true,
          settings: {
            smsGatewayKey: settings.smsGatewayKey || "",
            smsSenderName: settings.smsSenderName || "",
            configuredHours: settings.configuredHours || ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
          },
        });
      } catch (dbError: any) {
        console.error("Database query failed during settings load:", dbError);
        return res.status(503).json({
          error: "Database connection failed.",
          code: "DATABASE_OFFLINE",
        });
      }
    } catch (error: any) {
      console.error("Get settings error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { smsGatewayKey, smsSenderName, configuredHours } = parsed.data;

      try {
        const updateData: any = { smsGatewayKey, smsSenderName };
        if (configuredHours !== undefined) {
          updateData.configuredHours = configuredHours;
        }
        await fb.update("settings", updateData);
        return res.status(200).json({
          success: true,
          message: "Settings updated successfully.",
        });
      } catch (dbError: any) {
        console.error("Database error during settings update:", dbError);
        return res.status(503).json({
          error: "Database connection failed.",
          code: "DATABASE_OFFLINE",
        });
      }
    } catch (error: any) {
      console.error("Update settings error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async getPublicCalendarOverrides(req: Request, res: Response) {
    try {
      const overrides = await fb.get("settings/calendarOverrides") || {};
      return res.status(200).json({
        success: true,
        overrides,
      });
    } catch (error: any) {
      console.error("Get public calendar overrides error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async getPublicConfiguredHours(req: Request, res: Response) {
    try {
      const settings = await fb.get("settings") || {};
      const configuredHours = settings.configuredHours || ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
      return res.status(200).json({
        success: true,
        configuredHours,
      });
    } catch (error: any) {
      console.error("Get public configured hours error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async getCalendarOverrides(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      try {
        const overrides = await fb.get("settings/calendarOverrides") || {};
        return res.status(200).json({
          success: true,
          overrides,
        });
      } catch (dbError: any) {
        console.error("Database query failed during overrides load:", dbError);
        return res.status(503).json({
          error: "Database connection failed.",
          code: "DATABASE_OFFLINE",
        });
      }
    } catch (error: any) {
      console.error("Get calendar overrides error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  static async toggleCalendarOverride(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const parsed = toggleOverrideSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { dateStr, status } = parsed.data;

      try {
        await fb.update(`settings/calendarOverrides`, { [dateStr]: status });
        return res.status(200).json({
          success: true,
          message: "Calendar override updated successfully.",
        });
      } catch (dbError: any) {
        console.error("Database error during calendar override toggle:", dbError);
        return res.status(503).json({
          error: "Database connection failed.",
          code: "DATABASE_OFFLINE",
        });
      }
    } catch (error: any) {
      console.error("Toggle calendar override error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}
