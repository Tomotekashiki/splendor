import { fb } from '../database/firebase.js';
import { env } from '../config/environment.js';
import { SmsVerification } from '../models/types.js';

function formatGeorgianPhoneNumber(phone: string): string {
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If it starts with 00, remove the leading 00
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  
  // If it's a 9-digit Georgian mobile number starting with 5 (e.g. 599123456), prepend 995
  if (cleaned.length === 9 && cleaned.startsWith("5")) {
    cleaned = "995" + cleaned;
  }
  
  return cleaned;
}

export class SmsService {
  /**
   * Generates a 4-digit OTP code and records it.
   */
  static async sendOtp(phoneNumber: string): Promise<string> {
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Store as ISO String

    await fb.push("sms_verifications", {
      phoneNumber,
      otpCode,
      expiresAt,
      isVerified: false,
      createdAt: new Date().toISOString(),
    });

    if (env.SMS_MOCK_MODE) {
      console.log(`\n--- [SMS MOCK SENDER] ---`);
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: Your Splendor Verification Code is: ${otpCode}. Valid for 5 minutes.`);
      console.log(`-------------------------\n`);
    } else {
      console.log(`Sending real SMS to ${phoneNumber} via SMS Office...`);
      const formattedPhone = formatGeorgianPhoneNumber(phoneNumber);
      const messageText = `Your Splendor Verification Code is: ${otpCode}. Valid for 5 minutes.`;
      
      let apiKey = env.SMS_GATEWAY_API_KEY;
      let senderName = env.SMS_SENDER_NAME;
      try {
        const settings = await fb.get("settings") || {};
        if (settings.smsGatewayKey) {
          apiKey = settings.smsGatewayKey;
        }
        if (settings.smsSenderName) {
          senderName = settings.smsSenderName;
        }
      } catch (dbError) {
        console.warn("Could not load dynamic settings for SMS gateway, using environment fallback:", dbError);
      }
      
      const params = new URLSearchParams({
        key: apiKey,
        destination: formattedPhone,
        sender: senderName,
        content: messageText,
        urgent: "true"
      });
      
      try {
        const url = `https://smsoffice.ge/api/v2/send/?${params.toString()}`;
        const response = await fetch(url);
        const text = await response.text();
        console.log(`SMS Office RAW Response for ${formattedPhone}:`, text);
        try {
          const result = JSON.parse(text);
          if (result.Success === false) {
            console.error("SMS Office reports failure:", result.Message || result.ErrorCode);
          }
        } catch (e) {
          console.log(`SMS Office returned non-JSON response: ${text}`);
        }
      } catch (err) {
        console.error("Error calling SMS Office API:", err);
      }
    }

    return otpCode;
  }

  /**
   * Verifies the OTP code for a phone number.
   */
  static async verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    const now = new Date();

    const verificationsObj = await fb.get("sms_verifications") || {};
    const records = Object.values(verificationsObj) as SmsVerification[];

    const matchingRecord = records.find(rec => 
      rec.phoneNumber === phoneNumber &&
      rec.otpCode === otpCode &&
      !rec.isVerified &&
      new Date(rec.expiresAt) >= now
    );

    if (!matchingRecord) {
      return false;
    }

    // Mark as verified
    await fb.update(`sms_verifications/${matchingRecord.id}`, { isVerified: true });

    return true;
  }

  /**
   * Checks if the OTP code was already verified and is still valid.
   * If yes, consumes/deletes it and returns true.
   */
  static async checkAlreadyVerified(phoneNumber: string, otpCode: string): Promise<boolean> {
    const now = new Date();

    const verificationsObj = await fb.get("sms_verifications") || {};
    const records = Object.values(verificationsObj) as SmsVerification[];

    const matchingRecord = records.find(rec => 
      rec.phoneNumber === phoneNumber &&
      rec.otpCode === otpCode &&
      rec.isVerified &&
      new Date(rec.expiresAt) >= now
    );

    if (!matchingRecord) {
      return false;
    }

    // Delete or mark as fully consumed so it cannot be used again
    await fb.remove(`sms_verifications/${matchingRecord.id}`);

    return true;
  }
}
