import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { env, isOriginAllowed } from './config/environment.js';
import { initWebSocketServer } from './config/websockets.js';
import authRoutes from './routes/auth.routes.js';
import serviceRoutes from './routes/service.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminAuthRoutes from './routes/admin-auth.routes.js';
import userRoutes from './routes/user.routes.js';
import customerAuthRoutes from './routes/customer-auth.routes.js';
import branchRoutes from './routes/branch.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import settingsPublicRoutes from './routes/settings-public.routes.js';
import customerAdminRoutes from './routes/customer-admin.routes.js';
import chatRoutes from './routes/chat.routes.js';

import path from "path";

const app = express();
const server = createServer(app);

// Initialize WebSockets
initWebSocketServer(server);

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." }
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 OTP requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please wait 10 minutes before requesting a new code." }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // max 10 attempts per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please wait 10 minutes." }
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat messages. Please wait a moment." }
});

const slotsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // max 120 slot availability queries per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many availability queries. Please wait a moment." }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ limit: "500kb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Apply Rate Limiters to Sensitive Auth Endpoints
app.use("/api/auth/admin/login", authLimiter);
app.use("/api/auth/customer/login", authLimiter);
app.use("/api/auth/customer/register", authLimiter);
app.use("/api/auth/send-otp", otpSendLimiter);
app.use("/api/auth/verify-otp", otpVerifyLimiter);
app.use("/api/auth/customer/forgot-password", otpSendLimiter);
app.use("/api/auth/customer/reset-password", otpVerifyLimiter);
app.use("/api/chat", chatLimiter);
app.use("/api/bookings/available-slots", slotsLimiter);

// Routing API
app.use("/api/auth", authRoutes);
app.use("/api/auth/customer", customerAuthRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/settings", settingsPublicRoutes);
app.use("/api/admin/customers", customerAdminRoutes);
app.use("/api/chat", chatRoutes);

// Root & Health Check
app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    service: "Splendor Car Wash Backend API",
    status: "online",
    message: "Backend API is running. The Admin Dashboard UI is located on the frontend application at /admin.",
    timestamp: new Date(),
  });
});

app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Server Error Stack:", err);
  const statusCode = err.status || 500;
  const isProd = env.NODE_ENV === "production";
  const errorMessage = isProd && statusCode === 500
    ? "An unexpected server error occurred."
    : (err.message || "An unexpected server error occurred.");
  return res.status(statusCode).json({
    error: errorMessage,
  });
});

// Start Server
const port = env.PORT;

if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`===========================================`);
    console.log(`🚀 Splendor Backend running on http://localhost:${port}`);
    console.log(`📡 WebSocket server listening on CORS: ${env.WS_CORS_ORIGIN}`);
    console.log(`🛠️ Mode: ${env.NODE_ENV}`);
    console.log(`===========================================`);
  });
}

export default app;
