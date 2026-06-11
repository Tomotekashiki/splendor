import { Request, Response } from "express";
import { SmsService } from '../services/sms.service.js';
import { z } from "zod";

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(18),
});

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(18),
  otpCode: z.string().length(4),
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("995")) return "+" + digits;
  if (digits.length === 9) return "+995" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+995" + digits.slice(1);
  return "+995" + digits;
}

export class AuthController {
  static async sendOtp(req: Request, res: Response) {
    try {
      const parsed = sendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid phone number format." });
      }

      const phoneNumber = normalizePhone(parsed.data.phoneNumber);
      await SmsService.sendOtp(phoneNumber);
      return res.status(200).json({ success: true, message: "OTP code sent successfully." });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ error: "Failed to send verification code." });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters. OTP must be exactly 4 characters." });
      }

      const phoneNumber = normalizePhone(parsed.data.phoneNumber);
      const isValid = await SmsService.verifyOtp(phoneNumber, parsed.data.otpCode);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired verification code." });
      }

      return res.status(200).json({ success: true, message: "Verification successful." });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ error: "Verification process failed." });
    }
  }
}
