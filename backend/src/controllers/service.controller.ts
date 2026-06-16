import { Request, Response } from "express";
import { fb } from '../database/firebase.js';
import { VehicleType, Service, ServiceMatrix, WashingBay, Branch, Booking } from '../models/types.js';
import { z } from "zod";
import crypto from "crypto";

const serviceMatrixInputSchema = z.object({
  vehicleTypeId: z.string(),
  price: z.union([z.string(), z.number()]).transform(val => {
    return typeof val === 'number' ? val.toFixed(2) : val;
  }).refine(val => /^\d+(\.\d{1,2})?$/.test(val), {
    message: "Price must be a valid number or decimal string (e.g. 20.00)",
  }),
  durationMinutes: z.union([z.string(), z.number()]).transform(val => {
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }).refine(val => !isNaN(val) && val > 0, {
    message: "Duration must be a positive integer",
  }),
});

const serviceInputSchema = z.object({
  title: z.record(z.string()).optional(),
  name: z.union([z.string(), z.record(z.string())]).optional(),
  description: z.union([z.string(), z.record(z.string().nullable().optional())]).optional().nullable(),
  isAddon: z.boolean().default(false),
  matrix: z.array(serviceMatrixInputSchema),
}).refine(data => {
  const titleVal = data.title || data.name;
  if (!titleVal) return false;
  if (typeof titleVal === 'string') return titleVal.trim().length >= 2;
  return !!(titleVal.ka && titleVal.ka.trim().length >= 2);
}, {
  message: "Title or name with Georgian (ka) translation is required.",
  path: ["title"],
});

export class ServiceController {
  /**
   * Retrieves all vehicle types, services, washing bays, and the service pricing matrix.
   */
  static async getServiceGrid(req: Request, res: Response) {
    try {
      const typesObj = await fb.get("vehicle_types") || {};
      const types = Object.values(typesObj) as VehicleType[];
      types.sort((a, b) => a.displayOrder - b.displayOrder);

      const servicesObj = await fb.get("services") || {};
      const allServices = Object.values(servicesObj) as Service[];
      allServices.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      const matrixObj = await fb.get("service_matrix") || {};
      const matrix = Object.values(matrixObj) as ServiceMatrix[];

      const baysObj = await fb.get("washing_bays") || {};
      const bays = Object.values(baysObj) as WashingBay[];

      const branchesObj = await fb.get("branches") || {};
      const allBranches = Object.values(branchesObj) as Branch[];

      return res.status(200).json({
        vehicleTypes: types,
        services: allServices,
        serviceMatrix: matrix,
        washingBays: bays,
        branches: allBranches,
      });
    } catch (error: any) {
      console.error("Error fetching service grid:", error);
      return res.status(500).json({ error: "Failed to load services data." });
    }
  }

  /**
   * Creates a new wash service and its associated matrix prices.
   */
  static async createService(req: Request, res: Response) {
    try {
      const parsed = serviceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const { title, name, description, isAddon, matrix } = parsed.data;

      // Normalize title
      let titleObj: { ka: string; en: string; [key: string]: string };
      const rawTitle = title || name;
      if (typeof rawTitle === 'string') {
        titleObj = { ka: rawTitle, en: rawTitle };
      } else if (rawTitle && typeof rawTitle === 'object') {
        titleObj = {
          ka: rawTitle.ka || '',
          en: rawTitle.en || rawTitle.ka || '',
          ...rawTitle
        };
      } else {
        titleObj = { ka: '', en: '' };
      }

      // Normalize description
      let descObj: { ka: string | null; en: string | null; [key: string]: string | null } | null = null;
      if (typeof description === 'string') {
        descObj = { ka: description, en: description };
      } else if (description && typeof description === 'object') {
        descObj = {
          ka: description.ka ?? null,
          en: description.en ?? description.ka ?? null,
          ...description
        };
      }

      // Unique title check
      const servicesObj = await fb.get("services") || {};
      const servicesList = Object.values(servicesObj) as Service[];
      const alreadyExists = servicesList.some(s => {
        const titleKa = s.title?.ka || (typeof s.name === 'object' ? s.name?.ka : s.name);
        const titleEn = s.title?.en || (typeof s.name === 'object' ? s.name?.en : s.name);

        const inputKa = titleObj.ka;
        const inputEn = titleObj.en;

        const kaMatch = titleKa && inputKa && titleKa.toLowerCase() === inputKa.toLowerCase();
        const enMatch = titleEn && inputEn && titleEn.toLowerCase() === inputEn.toLowerCase();

        return kaMatch || enMatch;
      });
      if (alreadyExists) {
        return res.status(400).json({ error: "A service with this name/title already exists." });
      }

      const serviceId = crypto.randomUUID();
      const now = new Date().toISOString();

      const nextOrder = Math.max(...servicesList.map(s => s.displayOrder ?? 0), 0) + 1;

      const newService: Service = {
        id: serviceId,
        title: titleObj,
        description: descObj,
        isAddon,
        displayOrder: nextOrder,
        createdAt: now,
        updatedAt: now,
      };

      // Write service
      await fb.set(`services/${serviceId}`, newService);

      // Write service matrix entries
      if (matrix.length > 0) {
        const matrixUpdates: any = {};
        for (const item of matrix) {
          const matrixId = crypto.randomUUID();
          matrixUpdates[matrixId] = {
            id: matrixId,
            vehicleTypeId: item.vehicleTypeId,
            serviceId: serviceId,
            price: item.price,
            durationMinutes: item.durationMinutes,
            createdAt: now,
            updatedAt: now,
          };
        }
        await fb.update("service_matrix", matrixUpdates);
      }

      return res.status(201).json({ success: true, service: newService });
    } catch (error: any) {
      console.error("Error creating service:", error);
      return res.status(500).json({ error: error.message || "Failed to create service." });
    }
  }

  static async updateService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = serviceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const { title, name, description, isAddon, matrix } = parsed.data;

      const existingService = await fb.get(`services/${id}`) as Service | null;
      if (!existingService) {
        return res.status(404).json({ error: "Service not found." });
      }

      // Normalize title
      let titleObj: { ka: string; en: string; [key: string]: string };
      const rawTitle = title || name;
      if (typeof rawTitle === 'string') {
        titleObj = { ka: rawTitle, en: rawTitle };
      } else if (rawTitle && typeof rawTitle === 'object') {
        titleObj = {
          ka: rawTitle.ka || '',
          en: rawTitle.en || rawTitle.ka || '',
          ...rawTitle
        };
      } else {
        titleObj = { ka: '', en: '' };
      }

      // Normalize description
      let descObj: { ka: string | null; en: string | null; [key: string]: string | null } | null = null;
      if (typeof description === 'string') {
        descObj = { ka: description, en: description };
      } else if (description && typeof description === 'object') {
        descObj = {
          ka: description.ka ?? null,
          en: description.en ?? description.ka ?? null,
          ...description
        };
      }

      // Check unique title conflict
      const servicesObj = await fb.get("services") || {};
      const servicesList = Object.values(servicesObj) as Service[];
      const nameConflict = servicesList.some(s => {
        if (s.id === id) return false;
        const titleKa = s.title?.ka || (typeof s.name === 'object' ? s.name?.ka : s.name);
        const titleEn = s.title?.en || (typeof s.name === 'object' ? s.name?.en : s.name);

        const inputKa = titleObj.ka;
        const inputEn = titleObj.en;

        const kaMatch = titleKa && inputKa && titleKa.toLowerCase() === inputKa.toLowerCase();
        const enMatch = titleEn && inputEn && titleEn.toLowerCase() === inputEn.toLowerCase();

        return kaMatch || enMatch;
      });
      if (nameConflict) {
        return res.status(400).json({ error: "A service with this name/title already exists." });
      }

      const now = new Date().toISOString();
      const { name: _, ...cleanExisting } = existingService as any;

      const updatedService: Service = {
        ...cleanExisting,
        title: titleObj,
        description: descObj,
        isAddon,
        updatedAt: now,
      };

      // 1. Save updated service details
      await fb.set(`services/${id}`, updatedService);

      // 2. Delete existing matrix entries for this service
      const currentMatrixObj = await fb.get("service_matrix") || {};
      const keysToDelete = Object.keys(currentMatrixObj).filter(
        key => currentMatrixObj[key].serviceId === id
      );

      for (const key of keysToDelete) {
        await fb.remove(`service_matrix/${key}`);
      }

      // 3. Insert new matrix entries
      if (matrix.length > 0) {
        const matrixUpdates: any = {};
        for (const item of matrix) {
          const matrixId = crypto.randomUUID();
          matrixUpdates[matrixId] = {
            id: matrixId,
            vehicleTypeId: item.vehicleTypeId,
            serviceId: id,
            price: item.price,
            durationMinutes: item.durationMinutes,
            createdAt: now,
            updatedAt: now,
          };
        }
        await fb.update("service_matrix", matrixUpdates);
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error updating service:", error);
      return res.status(500).json({ error: error.message || "Failed to update service." });
    }
  }

  /**
   * Deletes a wash service (blocked if linked to historical bookings).
   */
  static async deleteService(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if linked to historical bookings
      const bookingsObj = await fb.get("bookings") || {};
      const bookingsList = Object.values(bookingsObj) as Booking[];
      const isLinkedToBooking = bookingsList.some(b => 
        (b.services || []).some(s => s.serviceId === id)
      );

      if (isLinkedToBooking) {
        return res.status(400).json({
          error: "Cannot delete this service because it is currently linked to historical wash reservations.",
        });
      }

      // 1. Delete associated matrix entries
      const currentMatrixObj = await fb.get("service_matrix") || {};
      const keysToDelete = Object.keys(currentMatrixObj).filter(
        key => currentMatrixObj[key].serviceId === id
      );

      for (const key of keysToDelete) {
        await fb.remove(`service_matrix/${key}`);
      }

      // 2. Delete service
      await fb.remove(`services/${id}`);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting service:", error);
      return res.status(500).json({ error: error.message || "Failed to delete service." });
    }
  }

  /**
   * Reorders the list of services by setting their displayOrder.
   */
  static async reorderServices(req: Request, res: Response) {
    try {
      const { serviceIds } = req.body;
      if (!Array.isArray(serviceIds)) {
        return res.status(400).json({ error: "Invalid parameters. serviceIds must be an array." });
      }

      const updates: any = {};
      for (let i = 0; i < serviceIds.length; i++) {
        const id = serviceIds[i];
        updates[`${id}/displayOrder`] = i + 1;
      }

      await fb.update("services", updates);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error reordering services:", error);
      return res.status(500).json({ error: "Failed to reorder services." });
    }
  }
}

