import { Request, Response } from "express";
import { fb } from '../database/firebase.js';
import { VehicleType, Service, ServiceMatrix, WashingBay, Branch, Booking } from '../models/types.js';
import { z } from "zod";
import crypto from "crypto";

const serviceMatrixInputSchema = z.object({
  vehicleTypeId: z.string().uuid(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  durationMinutes: z.number().int().positive(),
});

const serviceInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  isAddon: z.boolean().default(false),
  matrix: z.array(serviceMatrixInputSchema),
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

      const { name, description, isAddon, matrix } = parsed.data;

      // Unique name check
      const servicesObj = await fb.get("services") || {};
      const servicesList = Object.values(servicesObj) as Service[];
      const alreadyExists = servicesList.some(s => s.name.toLowerCase() === name.toLowerCase());
      if (alreadyExists) {
        return res.status(400).json({ error: "A service with this name already exists." });
      }

      const serviceId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newService: Service = {
        id: serviceId,
        name,
        description: description || null,
        isAddon,
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

  /**
   * Updates an existing wash service and overwrites its matrix configurations.
   */
  static async updateService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = serviceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const { name, description, isAddon, matrix } = parsed.data;

      const existingService = await fb.get(`services/${id}`) as Service | null;
      if (!existingService) {
        return res.status(404).json({ error: "Service not found." });
      }

      // Check unique name conflict
      const servicesObj = await fb.get("services") || {};
      const servicesList = Object.values(servicesObj) as Service[];
      const nameConflict = servicesList.some(s => s.id !== id && s.name.toLowerCase() === name.toLowerCase());
      if (nameConflict) {
        return res.status(400).json({ error: "A service with this name already exists." });
      }

      const now = new Date().toISOString();
      const updatedService: Service = {
        ...existingService,
        name,
        description: description || null,
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
}

