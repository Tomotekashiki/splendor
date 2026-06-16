import { Request, Response } from "express";
import { fb } from '../database/firebase.js';
import { Branch, WashingBay, Booking } from '../models/types.js';
import { z } from "zod";
import crypto from "crypto";

const branchInputSchema = z.object({
  name: z.union([z.string(), z.record(z.string())]),
  address: z.union([z.string(), z.record(z.string().nullable().optional())]).optional().nullable(),
  isActive: z.boolean().default(true),
  washingBaysCount: z.number().int().min(1).max(10).optional(),
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
      allBranches.sort((a, b) => {
        const nameA = typeof a.name === 'string' ? a.name : (a.name?.ka || a.name?.en || '');
        const nameB = typeof b.name === 'string' ? b.name : (b.name?.ka || b.name?.en || '');
        return nameA.localeCompare(nameB);
      });

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

      const { name, address, isActive, washingBaysCount } = parsed.data;

      // Normalize name
      let nameObj: { ka: string; en: string; [key: string]: string };
      if (typeof name === 'string') {
        nameObj = { ka: name, en: name };
      } else if (name && typeof name === 'object') {
        nameObj = {
          ka: name.ka || '',
          en: name.en || name.ka || '',
          ...name
        };
      } else {
        nameObj = { ka: '', en: '' };
      }

      // Normalize address
      let addrObj: { ka: string | null; en: string | null; [key: string]: string | null } | null = null;
      if (typeof address === 'string') {
        addrObj = { ka: address, en: address };
      } else if (address && typeof address === 'object') {
        addrObj = {
          ka: address.ka ?? null,
          en: address.en ?? address.ka ?? null,
          ...address
        };
      }

      // Uniqueness check
      const branchesObj = await fb.get("branches") || {};
      const branchesList = Object.values(branchesObj) as Branch[];
      const alreadyExists = branchesList.some(b => {
        const existingKa = typeof b.name === 'object' ? b.name?.ka : b.name;
        const existingEn = typeof b.name === 'object' ? b.name?.en : b.name;

        const inputKa = nameObj.ka;
        const inputEn = nameObj.en;

        const kaMatch = existingKa && inputKa && existingKa.toLowerCase() === inputKa.toLowerCase();
        const enMatch = existingEn && inputEn && existingEn.toLowerCase() === inputEn.toLowerCase();

        return kaMatch || enMatch;
      });
      if (alreadyExists) {
        return res.status(400).json({ error: "A branch with this name already exists." });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newBranch: Branch = {
        id,
        name: nameObj,
        address: addrObj,
        isActive,
        createdAt: now,
        updatedAt: now,
      };

      await fb.set(`branches/${id}`, newBranch);

      // Seed dynamic number of washing bays
      const baysCount = washingBaysCount || 1;
      for (let i = 1; i <= baysCount; i++) {
        const bayId = crypto.randomUUID();
        const newBay: WashingBay = {
          id: bayId,
          name: `ბოქსი ${i}`,
          isActive: true,
          branchId: id,
          createdAt: now,
          updatedAt: now,
        };
        await fb.set(`washing_bays/${bayId}`, newBay);
      }

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

      const { name, address, isActive, washingBaysCount } = parsed.data;

      // Verify branch exists
      const existingBranch = await fb.get(`branches/${id}`) as Branch | null;
      if (!existingBranch) {
        return res.status(404).json({ error: "Branch not found." });
      }

      // Normalize name
      let nameObj: { ka: string; en: string; [key: string]: string };
      if (typeof name === 'string') {
        nameObj = { ka: name, en: name };
      } else if (name && typeof name === 'object') {
        nameObj = {
          ka: name.ka || '',
          en: name.en || name.ka || '',
          ...name
        };
      } else {
        nameObj = { ka: '', en: '' };
      }

      // Normalize address
      let addrObj: { ka: string | null; en: string | null; [key: string]: string | null } | null = null;
      if (typeof address === 'string') {
        addrObj = { ka: address, en: address };
      } else if (address && typeof address === 'object') {
        addrObj = {
          ka: address.ka ?? null,
          en: address.en ?? address.ka ?? null,
          ...address
        };
      }

      // Check unique constraint excluding self
      const branchesObj = await fb.get("branches") || {};
      const branchesList = Object.values(branchesObj) as Branch[];
      const nameConflict = branchesList.some(b => {
        if (b.id === id) return false;
        const existingKa = typeof b.name === 'object' ? b.name?.ka : b.name;
        const existingEn = typeof b.name === 'object' ? b.name?.en : b.name;

        const inputKa = nameObj.ka;
        const inputEn = nameObj.en;

        const kaMatch = existingKa && inputKa && existingKa.toLowerCase() === inputKa.toLowerCase();
        const enMatch = existingEn && inputEn && existingEn.toLowerCase() === inputEn.toLowerCase();

        return kaMatch || enMatch;
      });
      if (nameConflict) {
        return res.status(400).json({ error: "A branch with this name already exists." });
      }

      const now = new Date().toISOString();
      const updatedBranch: Branch = {
        ...existingBranch,
        name: nameObj,
        address: addrObj,
        isActive,
        updatedAt: now,
      };

      await fb.set(`branches/${id}`, updatedBranch);

      // Manage washing bays count if provided
      if (washingBaysCount !== undefined) {
        const baysObj = await fb.get("washing_bays") || {};
        const baysList = Object.values(baysObj) as WashingBay[];
        const branchBays = baysList.filter(b => b.branchId === id);
        // Sort to maintain sequential numbering
        branchBays.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        if (branchBays.length < washingBaysCount) {
          const diff = washingBaysCount - branchBays.length;
          for (let i = 1; i <= diff; i++) {
            const nextNum = branchBays.length + i;
            const bayId = crypto.randomUUID();
            const newBay: WashingBay = {
              id: bayId,
              name: `ბოქსი ${nextNum}`,
              isActive: true,
              branchId: id,
              createdAt: now,
              updatedAt: now,
            };
            await fb.set(`washing_bays/${bayId}`, newBay);
          }
        } else if (branchBays.length > washingBaysCount) {
          const diff = branchBays.length - washingBaysCount;
          const baysToRemove = branchBays.slice(-diff);

          // Check if any bay to remove has bookings
          const bookingsObj = await fb.get("bookings") || {};
          const bookingsList = Object.values(bookingsObj) as Booking[];
          for (const bay of baysToRemove) {
            const hasBookings = bookingsList.some(b => b.washingBayId === bay.id && b.status !== "cancelled");
            if (hasBookings) {
              return res.status(400).json({ 
                error: `ვერ შემცირდება ბოქსების რაოდენობა, რადგან "${bay.name}"-ზე არის აქტიური ჯავშნები.` 
              });
            }
          }

          for (const bay of baysToRemove) {
            await fb.remove(`washing_bays/${bay.id}`);
          }
        }
      }

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

      // 1. Fetch associated washing bays
      const baysObj = await fb.get("washing_bays") || {};
      const baysList = Object.values(baysObj) as WashingBay[];
      const branchBays = baysList.filter(b => b.branchId === id);
      const branchBayIds = branchBays.map(b => b.id);

      // 2. Verify foreign key constraints (bookings)
      const bookingsObj = await fb.get("bookings") || {};
      const bookingsList = Object.values(bookingsObj) as Booking[];
      const hasBookings = bookingsList.some(b => 
        (b.branchId === id || branchBayIds.includes(b.washingBayId)) && 
        b.status !== "cancelled"
      );
      if (hasBookings) {
        return res.status(400).json({
          error: "Cannot delete this branch because it is currently linked to active bookings. Delete or reschedule the bookings first.",
        });
      }

      // 3. Delete associated bays
      for (const bay of branchBays) {
        await fb.remove(`washing_bays/${bay.id}`);
      }

      // 4. Delete branch
      await fb.remove(`branches/${id}`);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      return res.status(500).json({ error: error.message || "Failed to delete branch." });
    }
  }
}

