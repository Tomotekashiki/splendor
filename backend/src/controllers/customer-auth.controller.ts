import { Request, Response } from "express";
import { fb } from '../database/firebase.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../services/password.service.js';
import { SmsService } from '../services/sms.service.js';
import { Customer } from '../models/types.js';
import { z } from "zod";
import crypto from "crypto";

/**
 * Normalize phone number: always store/compare as +995XXXXXXXXX.
 * Accepts: "555111111", "+995555111111", "0555111111"
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("995")) return "+" + digits;
  if (digits.length === 9) return "+995" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+995" + digits.slice(1);
  return "+995" + digits;
}

const registerSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(6),
  phoneNumber: z.string().min(8),
  otpCode: z.string().length(4),
});

const loginSchema = z.object({
  phoneNumber: z.string().min(8),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(8),
});

const resetPasswordSchema = z.object({
  phoneNumber: z.string().min(8),
  otpCode: z.string().length(4),
  newPassword: z.string().min(6),
});

export class CustomerAuthController {
  static async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid form params.", details: parsed.error.issues });
      }

      const { name, password, phoneNumber: rawPhone, otpCode } = parsed.data;
      const phoneNumber = normalizePhone(rawPhone);

      // Fetch all customers to check uniqueness
      const customersObj = await fb.get("customers") || {};
      const customersList = Object.values(customersObj) as Customer[];

      // 1. Verify phone uniqueness
      const existingPhone = customersList.find(c => normalizePhone(c.phoneNumber || "") === phoneNumber);
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number is already linked to another account." });
      }

      // 2. Verify OTP code
      const isOtpValid = await SmsService.checkAlreadyVerified(phoneNumber, otpCode);
      if (!isOtpValid) {
        return res.status(400).json({ error: "არასწორი ან ვადაგასული SMS კოდი." });
      }

      // 2. Create customer account
      const customerId = crypto.randomUUID();
      const now = new Date().toISOString();
      const newCustomer: Customer = {
        id: customerId,
        name,
        passwordHash: hashPassword(password),
        phoneNumber,
        createdAt: now,
        updatedAt: now,
      };

      await fb.set(`customers/${customerId}`, newCustomer);

      const token = generateToken({ customerId: newCustomer.id, role: "customer" });

      return res.status(201).json({
        success: true,
        token,
        customer: {
          id: newCustomer.id,
          name: newCustomer.name,
          phoneNumber: newCustomer.phoneNumber,
        },
      });
    } catch (err: any) {
      console.error("Customer registration error:", err);
      return res.status(500).json({ error: "Failed to register account." });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid credentials format." });
      }

      const { phoneNumber: rawPhone, password } = parsed.data;
      const phoneNumber = normalizePhone(rawPhone);

      // 1. Fetch customer by phone number
      const customersObj = await fb.get("customers") || {};
      const customersList = Object.values(customersObj) as Customer[];
      // Match normalized phone OR raw input (for legacy records)
      const customer = customersList.find(c => normalizePhone(c.phoneNumber || "") === phoneNumber);

      if (!customer || !customer.passwordHash) {
        return res.status(401).json({ error: "Invalid phone number or password." });
      }

      if (customer.isBlocked) {
        return res.status(403).json({ error: "მომხმარებელი დაბლოკილია." });
      }

      // 2. Verify password
      const isMatch = verifyPassword(password, customer.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid phone number or password." });
      }

      const token = generateToken({ customerId: customer.id, role: "customer" });

      return res.status(200).json({
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
        },
      });
    } catch (err: any) {
      console.error("Customer login error:", err);
      return res.status(500).json({ error: "Failed to log in." });
    }
  }

  static async me(req: Request, res: Response) {
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

      const customer = await fb.get(`customers/${payload.customerId}`) as Customer | null;

      if (!customer) {
        return res.status(404).json({ error: "Customer profile not found." });
      }

      if (customer.isBlocked) {
        return res.status(403).json({ error: "მომხმარებელი დაბლოკილია." });
      }

      return res.status(200).json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
        },
      });
    } catch (err: any) {
      console.error("Me verification query failed:", err);
      return res.status(500).json({ error: "Failed to authenticate session." });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid phone number format." });
      }

      const { phoneNumber: rawPhone } = parsed.data;
      const phoneNumber = normalizePhone(rawPhone);

      // Fetch all customers
      const customersObj = await fb.get("customers") || {};
      const customersList = Object.values(customersObj) as Customer[];

      const customer = customersList.find(c => normalizePhone(c.phoneNumber || "") === phoneNumber);
      if (!customer) {
        return res.status(404).json({ error: "ამ ტელეფონის ნომრით მომხმარებელი ვერ მოიძებნა." });
      }
      if (customer.isBlocked) {
        return res.status(403).json({ error: "მოცემული ტელეფონის ნომრით მომხმარებელი დაბლოკილია." });
      }

      await SmsService.sendOtp(phoneNumber);

      return res.status(200).json({
        success: true,
        message: "OTP code sent successfully.",
      });
    } catch (err: any) {
      console.error("Customer forgot password error:", err);
      return res.status(500).json({ error: "Failed to send verification code." });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid reset parameters.", details: parsed.error.issues });
      }

      const { phoneNumber: rawPhone, otpCode, newPassword } = parsed.data;
      const phoneNumber = normalizePhone(rawPhone);

      // 1. Verify OTP code
      const isOtpValid = await SmsService.checkAlreadyVerified(phoneNumber, otpCode);
      if (!isOtpValid) {
        return res.status(400).json({ error: "არასწორი ან ვადაგასული SMS კოდი." });
      }

      // 2. Find customer
      const customersObj = await fb.get("customers") || {};
      const customersList = Object.values(customersObj) as Customer[];
      const customer = customersList.find(c => normalizePhone(c.phoneNumber || "") === phoneNumber);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
      }

      // 3. Update password
      const newHash = hashPassword(newPassword);
      await fb.update(`customers/${customer.id}`, { passwordHash: newHash, updatedAt: new Date().toISOString() });

      return res.status(200).json({
        success: true,
        message: "Password reset successful.",
      });
    } catch (err: any) {
      console.error("Customer reset password error:", err);
      return res.status(500).json({ error: "Failed to reset password." });
    }
  }

  static async updateProfile(req: Request, res: Response) {
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

      const { name } = req.body;
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: "სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან." });
      }

      const customer = await fb.get(`customers/${payload.customerId}`) as Customer | null;
      if (!customer) {
        return res.status(404).json({ error: "Customer profile not found." });
      }

      // Update name
      const now = new Date().toISOString();
      await fb.update(`customers/${payload.customerId}`, { 
        name: name.trim(), 
        updatedAt: now 
      });

      return res.status(200).json({
        success: true,
        customer: {
          id: customer.id,
          name: name.trim(),
          phoneNumber: customer.phoneNumber,
        },
      });
    } catch (err: any) {
      console.error("Update profile query failed:", err);
      return res.status(500).json({ error: "Failed to update profile." });
    }
  }
}
