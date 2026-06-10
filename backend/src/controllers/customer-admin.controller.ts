import { Request, Response } from "express";
import { fb } from "../database/firebase.js";
import { verifyToken } from "../services/password.service.js";
import { Customer } from "../models/types.js";
import { z } from "zod";

const toggleBlockSchema = z.object({
  isBlocked: z.boolean(),
});

function getAuthorizedUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== "admin" && decoded.role !== "manager")) return null;
  return decoded;
}

export class CustomerAdminController {
  static async toggleBlock(req: Request, res: Response) {
    try {
      const user = getAuthorizedUser(req);
      if (!user) {
        return res.status(403).json({ error: "Access denied. Admins and managers only." });
      }

      const { id } = req.params;
      const parsed = toggleBlockSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { isBlocked } = parsed.data;

      // Check if customer exists
      const customer = await fb.get(`customers/${id}`) as Customer | null;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
      }

      await fb.update(`customers/${id}`, {
        isBlocked,
        updatedAt: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: isBlocked ? "Customer blocked successfully." : "Customer unblocked successfully.",
      });
    } catch (error: any) {
      console.error("Toggle customer block error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}
