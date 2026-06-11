import { fb } from '../database/firebase.js';
import { Booking, Customer, ServiceMatrix, WashingBay, Service, VehicleType } from '../models/types.js';
import crypto from "crypto";

export interface CreateBookingInput {
  name: string;
  phoneNumber: string;
  vehicleTypeId: string;
  serviceIds: string[];
  startTime: Date;
  washingBayId?: string; // Optional (will auto-assign if not provided)
  paymentMethod: "on_site" | "card_online";
  paymentStatus?: "unpaid" | "paid" | "failed";
  notes?: string;
  customerId?: string;
  branchId?: string; // Added branchId field
}

export class BookingService {
  /**
   * Calculates the total duration and total price for selected services & vehicle type.
   */
  static async calculateTotalDetails(vehicleTypeId: string, serviceIds: string[]) {
    if (serviceIds.length === 0) {
      throw new Error("No services selected.");
    }

    // Fetch service matrix
    const matrixObj = await fb.get("service_matrix") || {};
    const matrixList = Object.values(matrixObj) as ServiceMatrix[];

    // Filter items matching vehicle type and selected services
    const items = matrixList.filter(
      item => item.vehicleTypeId === vehicleTypeId && serviceIds.includes(item.serviceId)
    );

    if (items.length !== serviceIds.length) {
      throw new Error("Some selected services are invalid for this vehicle type.");
    }

    const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const totalDuration = items.reduce((sum, item) => sum + item.durationMinutes, 0);

    return {
      items,
      totalPrice,
      totalDuration,
    };
  }

  /**
   * Lists available 15-minute start times for booking on a specific date.
   */
  static async findAvailableSlots(dateStr: string, vehicleTypeId: string, serviceIds: string[], branchId: string) {
    // 0. Check calendar overrides
    try {
      const override = await fb.get(`settings/calendarOverrides/${dateStr}`);
      if (override === "non_working") {
        return [];
      }
    } catch (err) {
      console.warn("Could not check calendar overrides, proceeding with standard slots check:", err);
    }

    // 1. Calculate duration needed
    const { totalDuration } = await this.calculateTotalDetails(vehicleTypeId, serviceIds);

    // 2. Fetch active washing bays for the selected branch
    const baysObj = await fb.get("washing_bays") || {};
    const bays = (Object.values(baysObj) as WashingBay[]).filter(
      bay => bay.isActive && bay.branchId === branchId
    );
    
    if (bays.length === 0) {
      return [];
    }

    // 3. Fetch all active bookings on the given date
    const bookingsObj = await fb.get("bookings") || {};
    const allBookings = Object.values(bookingsObj) as Booking[];
    
    // Day bookings (non-cancelled and matching date & branch)
    const dayBookings = allBookings.filter(b => 
      b.status !== "cancelled" && 
      b.startTime.startsWith(dateStr) &&
      b.branchId === branchId
    );

    // 4. Fetch dynamic configured hours
    let hours: string[] = [];
    try {
      const settings = await fb.get("settings") || {};
      hours = settings.configuredHours || [];
    } catch (err) {
      console.warn("Could not load configured hours, using defaults:", err);
    }

    if (hours.length === 0) {
      hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    }

    const availableSlots: string[] = [];

    // Generate timeslots from configured hours
    for (const timeStr of hours) {
      const [hStr, mStr] = timeStr.split(":");
      const hour = parseInt(hStr);
      const min = parseInt(mStr);

      const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00Z`);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000);

      // Check if slot overlaps with ANY booking in this branch
      const hasOverlap = dayBookings.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!hasOverlap) {
        availableSlots.push(slotStart.toISOString());
      }
    }

    return availableSlots;
  }

  /**
   * Inserts a new booking. Safely locks and rolls back if overlapping bookings occur.
   */
  static async createBooking(input: CreateBookingInput) {
    const {
      name,
      phoneNumber,
      vehicleTypeId,
      serviceIds,
      startTime,
      washingBayId,
      paymentMethod,
      paymentStatus = "unpaid",
      notes,
      customerId,
      branchId,
    } = input;

    // 1. Calculate durations & prices
    const { items, totalPrice, totalDuration } = await this.calculateTotalDetails(vehicleTypeId, serviceIds);
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);

    // 2. Resolve Customer Profile
    let resolvedCustomerId = customerId;
    const customersObj = await fb.get("customers") || {};
    const customersList = Object.values(customersObj) as Customer[];

    let customer = null;
    if (resolvedCustomerId) {
      customer = customersList.find(c => c.id === resolvedCustomerId);
    }

    if (!customer && phoneNumber) {
      customer = customersList.find(c => c.phoneNumber === phoneNumber);
    }

    if (customer && customer.isBlocked) {
      throw new Error("მოცემული ტელეფონის ნომრით ჯავშნის გაფორმება შეზღუდულია.");
    }

    const nowStr = new Date().toISOString();

    if (!customer) {
      const newCustId = crypto.randomUUID();
      const newCustomer: Customer = {
        id: newCustId,
        name,
        phoneNumber,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      await fb.set(`customers/${newCustId}`, newCustomer);
      resolvedCustomerId = newCustId;
    } else {
      resolvedCustomerId = customer.id;
      // Update name/phone if changed and matching customer profile
      const updateData: any = {};
      if (customer.name !== name) updateData.name = name;
      if (phoneNumber && customer.phoneNumber !== phoneNumber) updateData.phoneNumber = phoneNumber;
      
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = nowStr;
        await fb.update(`customers/${customer.id}`, updateData);
      }
    }

    // 3. Washing Bay Allocation
    let resolvedBranchId = branchId;
    if (washingBayId && !resolvedBranchId) {
      const bay = await fb.get(`washing_bays/${washingBayId}`) as WashingBay | null;
      if (bay) {
        resolvedBranchId = bay.branchId;
      }
    }

    if (!resolvedBranchId) {
      throw new Error("Branch selection is required.");
    }

    // Fetch active washing bays for the selected branch
    const baysObj = await fb.get("washing_bays") || {};
    const activeBays = (Object.values(baysObj) as WashingBay[]).filter(
      bay => bay.isActive && bay.branchId === resolvedBranchId
    );

    // 4. Generate Booking Reference ID (e.g. AG-2026-X)
    const uniqueHash = Math.floor(1000 + Math.random() * 9000);
    const dateFormatted = startTime.toISOString().slice(0, 10).replace(/-/g, "");
    const bookingRef = `AG-${dateFormatted}-${uniqueHash}`;

    // Create line item services
    const lineItems = items.map((itm) => ({
      serviceId: itm.serviceId,
      price: itm.price,
      durationMinutes: itm.durationMinutes,
    }));

    const newBookingId = crypto.randomUUID();
    const dateStr = startTime.toISOString().slice(0, 10);

    let doubleBookingDetected = false;

    // 5. Wrap booking insertion in transaction on /bookings node
    const result = await fb.transaction("bookings", (currentBookings) => {
      const bookingsMap = currentBookings || {};
      const dayBookings = Object.values(bookingsMap).filter((b: any) => 
        b.status !== "cancelled" && 
        b.startTime.startsWith(dateStr) &&
        b.branchId === resolvedBranchId
      );

      // Ensure no overlapping booking exists in the branch
      const hasOverlap = dayBookings.some((b: any) => {
        return startTime < new Date(b.endTime) && endTime > new Date(b.startTime);
      });

      if (hasOverlap) {
        doubleBookingDetected = true;
        return undefined; // Abort
      }

      // If no overlap, assign a washing bay (first active bay in the branch)
      const allocatedBayId = washingBayId || (activeBays[0] ? activeBays[0].id : null);
      if (!allocatedBayId) {
        doubleBookingDetected = true;
        return undefined; // Abort
      }

      // Add new booking
      bookingsMap[newBookingId] = {
        id: newBookingId,
        bookingId: bookingRef,
        customerId: resolvedCustomerId!,
        washingBayId: allocatedBayId,
        branchId: resolvedBranchId!,
        vehicleTypeId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalPrice: totalPrice.toFixed(2),
        paymentMethod,
        paymentStatus,
        status: "pending",
        notes: notes || null,
        createdAt: nowStr,
        updatedAt: nowStr,
        services: lineItems,
      };

      return bookingsMap;
    });

    if (doubleBookingDetected || !result.committed) {
      throw new Error("Double booking detected! This washing box was occupied by another booking just now. Please try another slot.");
    }

    // Retrieve inserted booking
    const inserted = await fb.get(`bookings/${newBookingId}`) as Booking;
    return inserted;
  }

  /**
   * Reschedules or moves a booking (handles admin drag-and-drop operations).
   */
  static async moveBooking(bookingId: string, targetBayId: string, newStartTimeStr: string) {
    const booking = await fb.get(`bookings/${bookingId}`) as Booking | null;
    if (!booking) {
      throw new Error("Booking not found");
    }

    const totalDuration = (booking.services || []).reduce((sum, item) => sum + item.durationMinutes, 0);
    const startTime = new Date(newStartTimeStr);
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);
    const dateStr = startTime.toISOString().slice(0, 10);

    let doubleBookingDetected = false;

    // Use transaction to ensure reschedule target is vacant
    const result = await fb.transaction("bookings", (currentBookings) => {
      const bookingsMap = currentBookings || {};
      const dayBookings = Object.values(bookingsMap).filter((b: any) => 
        b.id !== bookingId &&
        b.status !== "cancelled" && 
        b.startTime.startsWith(dateStr) &&
        b.branchId === booking.branchId
      );

      const hasOverlap = dayBookings.some((b: any) => {
        return startTime < new Date(b.endTime) && endTime > new Date(b.startTime);
      });

      if (hasOverlap) {
        doubleBookingDetected = true;
        return undefined; // Abort
      }

      // Update coordinates
      if (bookingsMap[bookingId]) {
        bookingsMap[bookingId].washingBayId = targetBayId;
        bookingsMap[bookingId].startTime = startTime.toISOString();
        bookingsMap[bookingId].endTime = endTime.toISOString();
        bookingsMap[bookingId].updatedAt = new Date().toISOString();
      }

      return bookingsMap;
    });

    if (doubleBookingDetected || !result.committed) {
      throw new Error("Cannot move booking. The target slot/washing box overlaps with an existing reservation.");
    }

    const updated = await fb.get(`bookings/${bookingId}`) as Booking;
    return updated;
  }
}

