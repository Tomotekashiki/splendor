import { Router } from "express";
import { BookingController } from '../controllers/booking.controller.js';
import { requireAdminOrManager, requireCustomer } from '../middleware/auth.middleware.js';

const router = Router();

// Client routes
router.get("/available-slots", BookingController.getAvailableSlots);
router.get("/my-bookings", requireCustomer, BookingController.getMyBookings);
router.post("/", BookingController.create);

// Admin dashboard routes
router.get("/admin/dashboard/stats", requireAdminOrManager, BookingController.getDashboardData);
router.patch("/admin/:id/move", requireAdminOrManager, BookingController.move);
router.patch("/admin/:id/status", requireAdminOrManager, BookingController.updateStatus);

export default router;
