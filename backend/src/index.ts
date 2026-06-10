import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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

const app = express();
const server = createServer(app);

// Initialize WebSockets
initWebSocketServer(server);

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health Check
app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Server Error Stack:", err);
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    error: err.message || "An unexpected server error occurred.",
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
