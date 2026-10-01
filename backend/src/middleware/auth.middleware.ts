import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/password.service.js";

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Ensures a valid Bearer token is provided.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or invalid." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Session expired or invalid." });
  }

  req.user = decoded;
  next();
}

/**
 * Requires 'admin' role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    next();
  });
}

/**
 * Requires either 'admin' or 'manager' role.
 */
export function requireAdminOrManager(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin" && req.user?.role !== "manager") {
      return res.status(403).json({ error: "Access denied. Admin or manager role required." });
    }
    next();
  });
}

/**
 * Requires 'customer' role.
 */
export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "customer") {
      return res.status(403).json({ error: "Access denied. Customer account required." });
    }
    next();
  });
}
