import { Request, Response } from "express";
import { fb } from '../database/firebase.js';
import { Branch, WashingBay, Booking } from '../models/types.js';
import { z } from "zod";
import crypto from "crypto";

const branchInputSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export class BranchController {
  /**
   * Retrieves all branches.
   */
  static async list(req: Request, res: Response) {
    try {
      const branchesObj = await fb.get("branches") || {};
      const allBranches = Object.values(branchesObj) as Branch[];
      
      // Sort by name
      allBranches.sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({ success: true, branches: allBranches });
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      return res.status(500).json({ error: "Failed to load branches." });
    }
  }

  /**
   * Creates a new branch.
   */
  static async create(req: Request, res: Response) {
    try {
      const parsed = branchInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const { name, address, isActive } = parsed.data;

      // Uniqueness check
      const branchesObj = await fb.get("branches") || {};
      const branchesList = Object.values(branchesObj) as Branch[];
      const alreadyExists = branchesList.some(b => b.name.toLowerCase() === name.toLowerCase());
      if (alreadyExists) {
        return res.status(400).json({ error: "A branch with this name already exists." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newBranch: Branch = {
        id,
        name,
        address: address || null,
        isActive,
        createdAt: now,
        updatedAt: now,
      };

      await fb.set(`branches/${id}`, newBranch);

      return res.status(201).json({ success: true, branch: newBranch });
    } catch (error: any) {
      console.error("Error creating branch:", error);
      return res.status(500).json({ error: error.message || "Failed to create branch." });
    }
  }

  /**
   * Updates an existing branch.
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = branchInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const { name, address, isActive } = parsed.data;

      // Verify branch exists
      const existingBranch = await fb.get(`branches/${id}`) as Branch | null;
      if (!existingBranch) {
        return res.status(404).json({ error: "Branch not found." });
      }

      // Check unique constraint excluding self
      const branchesObj = await fb.get("branches") || {};
      const branchesList = Object.values(branchesObj) as Branch[];
      const nameConflict = branchesList.some(b => b.id !== id && b.name.toLowerCase() === name.toLowerCase());
      if (nameConflict) {
        return res.status(400).json({ error: "A branch with this name already exists." });
      }

      const now = new Date().toISOString();
      const updatedBranch: Branch = {
        ...existingBranch,
        name,
        address: address || null,
        isActive,
        updatedAt: now,
      };

      await fb.set(`branches/${id}`, updatedBranch);

      return res.status(200).json({ success: true, branch: updatedBranch });
    } catch (error: any) {
      console.error("Error updating branch:", error);
      return res.status(500).json({ error: error.message || "Failed to update branch." });
    }
  }

  /**
   * Deletes an existing branch.
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 1. Verify foreign key constraints (washing bays)
      const baysObj = await fb.get("washing_bays") || {};
      const baysList = Object.values(baysObj) as WashingBay[];
      const hasBays = baysList.some(b => b.branchId === id);
      if (hasBays) {
        return res.status(400).json({
          error: "Cannot delete this branch because it is currently linked to washing bays. Delete the washing bays first.",
        });
      }

      // 2. Verify foreign key constraints (bookings)
      const bookingsObj = await fb.get("bookings") || {};
      const bookingsList = Object.values(bookingsObj) as Booking[];
      const hasBookings = bookingsList.some(b => b.branchId === id && b.status !== "cancelled");
      if (hasBookings) {
        return res.status(400).json({
          error: "Cannot delete this branch because it is currently linked to active bookings. Delete or reschedule the bookings first.",
        });
      }

      await fb.remove(`branches/${id}`);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      return res.status(500).json({ error: error.message || "Failed to delete branch." });
    }
  }
}

