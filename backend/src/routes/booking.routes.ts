import { Router } from "express";
import { BookingController } from '../controllers/booking.controller.js';

const router = Router();

// Client routes
router.get("/available-slots", BookingController.getAvailableSlots);
router.get("/my-bookings", BookingController.getMyBookings);
router.post("/", BookingController.create);

// Admin dashboard routes
router.get("/admin/dashboard/stats", BookingController.getDashboardData);
router.patch("/admin/:id/move", BookingController.move);
router.patch("/admin/:id/status", BookingController.updateStatus);

export default router;
