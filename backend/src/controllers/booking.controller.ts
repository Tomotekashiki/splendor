import { Request, Response } from "express";
import { BookingService } from '../services/booking.service.js';
import { SmsService } from '../services/sms.service.js';
import { PaymentService } from '../services/payment.service.js';
import { broadcastToAdmins } from '../config/websockets.js';
import { fb } from '../database/firebase.js';
import { z } from "zod";
import { verifyToken } from "../services/password.service.js";
import { Booking, Customer, VehicleType, Branch, Service } from '../models/types.js';

const availableSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  vehicleTypeId: z.string().uuid(),
  serviceIds: z.string().transform((val) => val.split(",")),
  branchId: z.string().uuid(),
});

const createBookingSchema = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().min(8),
  otpCode: z.string().optional(), // Optional for verified customers/admin overrides
  isAdminEntry: z.boolean().default(false),
  vehicleTypeId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()),
  startTime: z.string().transform((val) => new Date(val)),
  washingBayId: z.string().uuid().optional(),
  paymentMethod: z.enum(["on_site", "card_online"]),
  cardNumber: z.string().optional(), // Needed if card_online
  notes: z.string().optional(),
  branchId: z.string().uuid().optional(),
});

const moveBookingSchema = z.object({
  washingBayId: z.string().uuid(),
  startTime: z.string(),
});

// In-memory join relations compiler for output payload consistency
async function populateBooking(booking: Booking | null) {
  if (!booking) return null;

  const customer = await fb.get(`customers/${booking.customerId}`) as Customer | null;
  const vehicleType = await fb.get(`vehicle_types/${booking.vehicleTypeId}`) as VehicleType | null;
  const branch = await fb.get(`branches/${booking.branchId}`) as Branch | null;

  const servicesObj = await fb.get("services") || {};
  const servicesList = Object.values(servicesObj) as Service[];

  const populatedServices = (booking.services || []).map((bs) => {
    const serviceInfo = servicesList.find(s => s.id === bs.serviceId);
    return {
      bookingId: booking.id,
      serviceId: bs.serviceId,
      price: bs.price,
      durationMinutes: bs.durationMinutes,
      service: serviceInfo || null
    };
  });

  return {
    ...booking,
    customer,
    vehicleType,
    branch,
    bookingServices: populatedServices,
  };
}

interface PrefetchedData {
  customers: Record<string, Customer>;
  vehicleTypes: Record<string, VehicleType>;
  branches: Record<string, Branch>;
  services: Service[];
}

async function fetchLookupData(): Promise<PrefetchedData> {
  const [customers, vehicleTypes, branches, servicesObj] = await Promise.all([
    fb.get("customers"),
    fb.get("vehicle_types"),
    fb.get("branches"),
    fb.get("services")
  ]);

  return {
    customers: customers || {},
    vehicleTypes: vehicleTypes || {},
    branches: branches || {},
    services: servicesObj ? Object.values(servicesObj) as Service[] : []
  };
}

function populateBookingSync(booking: Booking | null, data: PrefetchedData) {
  if (!booking) return null;

  const customer = data.customers[booking.customerId] || null;
  const vehicleType = data.vehicleTypes[booking.vehicleTypeId] || null;
  const branch = data.branches[booking.branchId] || null;

  const populatedServices = (booking.services || []).map((bs) => {
    const serviceInfo = data.services.find(s => s.id === bs.serviceId);
    return {
      bookingId: booking.id,
      serviceId: bs.serviceId,
      price: bs.price,
      durationMinutes: bs.durationMinutes,
      service: serviceInfo || null
    };
  });

  return {
    ...booking,
    customer,
    vehicleType,
    branch,
    bookingServices: populatedServices,
  };
}


export class BookingController {
  /**
   * Retrieves available timeslots for a requested day, vehicle type, and package combination.
   */
  static async getAvailableSlots(req: Request, res: Response) {
    try {
      const query = availableSlotsSchema.safeParse(req.query);
      if (!query.success) {
        return res.status(400).json({ error: "Invalid parameters. Require date (YYYY-MM-DD), vehicleTypeId, serviceIds, and branchId." });
      }

      const { date, vehicleTypeId, serviceIds, branchId } = query.data;
      const slots = await BookingService.findAvailableSlots(date, vehicleTypeId, serviceIds, branchId);
      return res.status(200).json({ slots });
    } catch (error: any) {
      console.error("Error getting available slots:", error);
      return res.status(500).json({ error: error.message || "Failed to load slots." });
    }
  }

  /**
   * Retrieves all bookings for the logged-in customer.
   */
  static async getMyBookings(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No session token supplied." });
      }

      const tokenStr = authHeader.split(" ")[1];
      const payload = verifyToken(tokenStr);
      if (!payload || payload.role !== "customer") {
        return res.status(401).json({ error: "Session token is invalid or expired." });
      }

      const customerId = payload.customerId;
      
      // Fetch bookings and lookup data in parallel!
      const [bookingsObj, lookupData] = await Promise.all([
        fb.get("bookings") as Promise<Record<string, Booking> | null>,
        fetchLookupData()
      ]);
      const allBookings = bookingsObj ? Object.values(bookingsObj) : [];

      const customerBookings = allBookings.filter(b => b.customerId === customerId);

      // Sort bookings by start time descending
      customerBookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      const populatedBookings = [];
      for (const b of customerBookings) {
        const pop = populateBookingSync(b, lookupData);
        if (pop) populatedBookings.push(pop);
      }

      return res.status(200).json({ success: true, bookings: populatedBookings });
    } catch (error: any) {
      console.error("Error getting customer bookings:", error);
      return res.status(500).json({ error: "Failed to load bookings." });
    }
  }

  /**
   * Submits and registers a car wash booking.
   */
  static async create(req: Request, res: Response) {
    try {
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters.", details: parsed.error.issues });
      }

      const input = parsed.data;

      // 1. Resolve Customer Token context or Verify OTP for online client bookings
      let customerId: string | undefined = undefined;
      let isVerifiedCustomer = false;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const tokenStr = authHeader.split(" ")[1];
        const payload = verifyToken(tokenStr);
        if (payload && payload.role === "customer" && !payload.incomplete) {
          customerId = payload.customerId;
          isVerifiedCustomer = true;
        }
      }

      // Guest checkout OTP validation (TEMPORARILY DISABLED)
      /*
      if (!input.isAdminEntry && !isVerifiedCustomer) {
        if (!input.otpCode) {
          return res.status(400).json({ error: "SMS Verification OTP is required to submit a booking." });
        }
        const isOtpValid = await SmsService.verifyOtp(input.phoneNumber, input.otpCode);
        if (!isOtpValid) {
          return res.status(400).json({ error: "Invalid or expired SMS OTP code." });
        }
      }
      */

      // 2. Perform payment transaction if selected online payment
      let paymentStatus: "unpaid" | "paid" | "failed" = "unpaid";
      if (input.paymentMethod === "card_online") {
        if (!input.cardNumber) {
          return res.status(400).json({ error: "Card credentials are required for online payments." });
        }
        
        // Calculate price beforehand to run gateway transaction
        const { totalPrice } = await BookingService.calculateTotalDetails(input.vehicleTypeId, input.serviceIds);

        const gatewayResult = await PaymentService.processCardPayment(
          totalPrice,
          input.cardNumber
        );

        if (!gatewayResult.success) {
          return res.status(400).json({ error: gatewayResult.error || "Online card transaction failed." });
        }
        paymentStatus = "paid";
      }

      // 3. Create the database booking
      const resultBooking = await BookingService.createBooking({
        name: input.name,
        phoneNumber: input.phoneNumber,
        vehicleTypeId: input.vehicleTypeId,
        serviceIds: input.serviceIds,
        startTime: input.startTime,
        washingBayId: input.washingBayId,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        notes: input.notes,
        customerId,
        branchId: input.branchId,
      });

      // Fetch complete populated booking context for real-time dispatch
      const populated = await populateBooking(resultBooking);

      // 4. Notify admin dashboard instantly via WebSockets
      broadcastToAdmins("booking_created", populated);

      return res.status(201).json({ success: true, booking: populated });
    } catch (error: any) {
      console.error("Error creating booking:", error);
      return res.status(400).json({ error: error.message || "Failed to submit booking." });
    }
  }

  /**
   * Reschedules a booking slot or changes its washing box (drag-and-drop).
   */
  static async move(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = moveBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid params. Requires washingBayId and startTime." });
      }

      const updated = await BookingService.moveBooking(id, parsed.data.washingBayId, parsed.data.startTime);
      const populated = await populateBooking(updated);

      // Notify dashboard view
      broadcastToAdmins("booking_updated", populated);

      return res.status(200).json({ success: true, booking: populated });
    } catch (error: any) {
      console.error("Error moving booking:", error);
      return res.status(400).json({ error: error.message || "Failed to update booking schedule." });
    }
  }

  /**
   * Retrieves dashboard statistics and current customer list for today.
   */
  static async getDashboardData(req: Request, res: Response) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);

      // Fetch bookings and lookup data in parallel!
      const [bookingsObj, lookupData] = await Promise.all([
        fb.get("bookings") as Promise<Record<string, Booking> | null>,
        fetchLookupData()
      ]);
      const allBookings = bookingsObj ? Object.values(bookingsObj) : [];

      // Populate all bookings for frontend list and calendar
      const populatedAllBookings = [];
      for (const b of allBookings) {
        const pop = populateBookingSync(b, lookupData);
        if (pop) populatedAllBookings.push(pop);
      }

      // Filter bookings for today (same date) to calculate stats
      const todayBookings = populatedAllBookings.filter(b => b.startTime.startsWith(dateStr));

      // Calculate stats
      const stats = {
        pending: todayBookings.filter((b) => b.status === "pending").length,
        inProgress: todayBookings.filter((b) => b.status === "in_progress").length,
        completed: todayBookings.filter((b) => b.status === "completed").length,
      };

      const revenueToday = todayBookings
        .filter((b) => b.status === "completed" || b.paymentStatus === "paid")
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

      // CRM customer summary logic
      const rawCustomers = Object.values(lookupData.customers);

      const customerHistory = rawCustomers.map((cust) => {
        const customerBookings = populatedAllBookings.filter(b => b.customerId === cust.id);
        const totalSpent = customerBookings
          .filter((b) => b.paymentStatus === "paid" || b.status === "completed")
          .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

        return {
          id: cust.id,
          name: cust.name,
          phoneNumber: cust.phoneNumber,
          isBlocked: !!cust.isBlocked,
          createdAt: cust.createdAt,
          bookingsCount: customerBookings.length,
          lifetimeValue: totalSpent,
          history: customerBookings.map((b) => ({
            id: b.id,
            bookingId: b.bookingId,
            startTime: b.startTime,
            status: b.status,
            totalPrice: b.totalPrice,
            branch: b.branch ? b.branch.name : null,
          })),
        };
      });

      return res.status(200).json({
        bookings: populatedAllBookings,
        revenueToday,
        stats,
        crm: customerHistory,
      });
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      return res.status(500).json({ error: "Failed to load dashboard metrics." });
    }
  }

  /**
   * Updates booking status (Pending -> In Progress -> Completed -> Cancelled)
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      const booking = await fb.get(`bookings/${id}`) as Booking | null;
      if (!booking) {
        return res.status(404).json({ error: "Booking not found." });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      updateData.updatedAt = new Date().toISOString();

      await fb.update(`bookings/${id}`, updateData);

      const updated = await fb.get(`bookings/${id}`) as Booking;
      const populated = await populateBooking(updated);

      broadcastToAdmins("booking_updated", populated);

      return res.status(200).json({ success: true, booking: populated });
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      return res.status(500).json({ error: "Failed to update booking status." });
    }
  }
}
