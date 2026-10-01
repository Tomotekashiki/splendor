import { Router } from "express";
import rateLimit from "express-rate-limit";
import { BookingController } from '../controllers/booking.controller.js';
import { requireAdminOrManager, requireCustomer } from '../middleware/auth.middleware.js';

const router = Router();

const bookingCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking requests from this network. Please wait a few minutes before trying again." }
});

// Client routes
router.get("/available-slots", BookingController.getAvailableSlots);
router.get("/my-bookings", requireCustomer, BookingController.getMyBookings);
router.post("/", bookingCreateLimiter, BookingController.create);

// Admin dashboard routes
router.get("/admin/dashboard/stats", requireAdminOrManager, BookingController.getDashboardData);
router.patch("/admin/:id/move", requireAdminOrManager, BookingController.move);
router.patch("/admin/:id/status", requireAdminOrManager, BookingController.updateStatus);

export default router;
