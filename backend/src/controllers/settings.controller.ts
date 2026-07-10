import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import { verifyToken } from "../services/password.service.js";
import { z } from "zod";
import { exec } from "child_process";

function curlFetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const escapedUrl = url.replace(/"/g, '\\"');
    const cmd = `curl.exe -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: application/json" "${escapedUrl}"`;
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (parseErr) {
        reject(new Error(`Failed to parse response: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

const updateSettingsSchema = z.object({
  smsGatewayKey: z.string().min(1, "SMS Office API key cannot be empty"),
  smsSenderName: z.string().min(1, "SMS Sender Name cannot be empty"),
  configuredHours: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).optional(),
  branchConfiguredHours: z.record(z.string(), z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"))).optional(),
  bookingWindowDays: z.number().int().min(0, "Booking window limit cannot be negative").optional(),
  bookingDisabled: z.boolean().optional(),
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
            branchConfiguredHours: settings.branchConfiguredHours || {},
            bookingWindowDays: settings.bookingWindowDays || 0,
            bookingDisabled: settings.bookingDisabled || false,
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

      const { smsGatewayKey, smsSenderName, configuredHours, branchConfiguredHours, bookingWindowDays, bookingDisabled } = parsed.data;

      try {
        const updateData: any = { smsGatewayKey, smsSenderName };
        if (configuredHours !== undefined) {
          updateData.configuredHours = configuredHours;
        }
        if (branchConfiguredHours !== undefined) {
          updateData.branchConfiguredHours = branchConfiguredHours;
        }
        if (bookingWindowDays !== undefined) {
          updateData.bookingWindowDays = bookingWindowDays;
        }
        if (bookingDisabled !== undefined) {
          updateData.bookingDisabled = bookingDisabled;
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
      const settings = await fb.get("settings") || {};
      const bookingWindowDays = settings.bookingWindowDays || 0;
      const bookingDisabled = settings.bookingDisabled || false;
      return res.status(200).json({
        success: true,
        overrides,
        bookingWindowDays,
        bookingDisabled,
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

  static async syncVehicles(req: Request, res: Response) {
    try {
      const admin = getAdminUser(req);
      if (!admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      // 1. Fetch manufacturers
      const mansUrl = 'https://api.myauto.ge/api/v1/search-filter?filter%5BvehicleType%5D=0&filter%5BfilterTypes%5D=manufacturers';
      const mansResult = await curlFetch(mansUrl);
      const manufacturers = mansResult.data?.manufacturers || [];
      if (manufacturers.length === 0) {
        return res.status(400).json({ error: "No manufacturers returned from MyAuto API." });
      }

      // Format makes for storage
      const makes = manufacturers.map((man: any) => ({
        manId: man.manId,
        manName: man.manName
      }));

      // Sort alphabetically
      makes.sort((a: any, b: any) => a.manName.localeCompare(b.manName));

      // 2. Fetch models for each manufacturer in batches of 15
      const allModels: Record<string, string[]> = {};
      const batchSize = 15;

      for (let i = 0; i < manufacturers.length; i += batchSize) {
        const batch = manufacturers.slice(i, i + batchSize);
        const promises = batch.map(async (man: any) => {
          const modelsUrl = `https://api.myauto.ge/api/v1/search-filter?filter%5BvehicleType%5D=0&filter%5BfilterTypes%5D=models&filter%5Bman_id%5D=${man.manId}`;
          try {
            const modelsResult = await curlFetch(modelsUrl);
            const models = modelsResult.data?.models || [];
            allModels[man.manId] = models.map((m: any) => m.modelName);
          } catch (err: any) {
            console.error(`Failed to fetch models for manId ${man.manId} (${man.manName}):`, err.message);
            allModels[man.manId] = [];
          }
        });

        await Promise.all(promises);
        // Small delay between batches to be polite to the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 3. Write to Database
      await fb.set("vehicles/makes", makes);
      
      // Update each manufacturer's models node
      const modelUpdates: Record<string, any> = {};
      for (const manId of Object.keys(allModels)) {
        modelUpdates[manId] = allModels[manId];
      }
      await fb.set("vehicles/models", modelUpdates);

      let totalModels = 0;
      for (const list of Object.values(allModels)) {
        totalModels += list.length;
      }

      return res.status(200).json({
        success: true,
        message: `სინქრონიზაცია წარმატებით დასრულდა: ჩაიწერა ${makes.length} მწარმოებელი და ${totalModels} მოდელი.`,
      });

    } catch (error: any) {
      console.error("Sync vehicles error:", error);
      return res.status(500).json({ error: "სინქრონიზაციისას დაფიქსირდა შეცდომა." });
    }
  }

  static async getPublicMakes(req: Request, res: Response) {
    try {
      const makes = await fb.get("vehicles/makes");
      if (makes && Array.isArray(makes)) {
        return res.status(200).json({ success: true, makes });
      }

      // Fallback to static dictionary keys if DB is not populated yet
      const fallbackMakes = [
        "Toyota", "Mercedes-Benz", "BMW", "Lexus", "Ford", 
        "Hyundai", "Honda", "Nissan", "Audi", "Volkswagen", "Opel"
      ].map((name, idx) => ({ manId: 1000 + idx, manName: name }));

      return res.status(200).json({ success: true, makes: fallbackMakes });
    } catch (error: any) {
      console.error("Get public makes error:", error);
      return res.status(500).json({ error: "მწარმოებლების წამოღება ვერ მოხერხდა." });
    }
  }

  static async getPublicModels(req: Request, res: Response) {
    try {
      const make = req.query.make as string;
      if (!make) {
        return res.status(400).json({ error: "მწარმოებლის პარამეტრი სავალდებულოა." });
      }

      // Check fallback first for "Other"
      if (make === "Other") {
        return res.status(200).json({ success: true, models: [] });
      }

      // Get makes list from DB to find the manId
      const makes = await fb.get("vehicles/makes");
      let foundManId: number | null = null;

      if (makes && Array.isArray(makes)) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedInput = normalize(make);
        const match = makes.find((m: any) => normalize(m.manName) === normalizedInput);
        if (match) {
          foundManId = match.manId;
        }
      }

      if (foundManId !== null) {
        const models = await fb.get(`vehicles/models/${foundManId}`);
        if (models && Array.isArray(models)) {
          return res.status(200).json({ success: true, models });
        }
      }

      // Fallback to static dictionary values
      const staticBrands: Record<string, string[]> = {
        "Toyota": ["Prius", "Camry", "RAV4", "Corolla", "Land Cruiser", "Aqua", "Vitz", "Yaris", "Prius C"],
        "Mercedes-Benz": ["E-Class", "C-Class", "S-Class", "ML-Class", "G-Class", "GLC-Class", "A-Class", "CLA-Class", "Sprinter"],
        "BMW": ["3 Series", "5 Series", "7 Series", "X5", "X6", "1 Series", "4 Series", "X3", "X1"],
        "Lexus": ["RX", "GX", "IS", "ES", "NX", "LX", "CT200h"],
        "Ford": ["Fusion", "Mustang", "Focus", "Escape", "Explorer", "F-150", "Fiesta"],
        "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Accent", "Ioniq"],
        "Honda": ["Civic", "CR-V", "Fit", "Insight", "Accord", "HR-V"],
        "Nissan": ["Tiida", "Juke", "Leaf", "X-Trail", "Rogue", "Sentra"],
        "Audi": ["A4", "A6", "A8", "Q5", "Q7", "e-tron", "A3"],
        "Volkswagen": ["Golf", "Passat", "Tiguan", "Jetta", "ID.4", "Polo"],
        "Opel": ["Astra", "Corsa", "Vectra", "Zafira", "Insignia"]
      };

      const fallbackModels = staticBrands[make] || [];
      return res.status(200).json({ success: true, models: fallbackModels });

    } catch (error: any) {
      console.error("Get public models error:", error);
      return res.status(500).json({ error: "მოდელების წამოღება ვერ მოხერხდა." });
    }
  }
}
