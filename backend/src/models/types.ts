export interface VehicleType {
  id: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  name?: string | { ka: string; en: string }; // Backward compatibility
  title?: { ka: string; en: string; [key: string]: string };
  isAddon: boolean;
  description: string | null | { ka: string | null; en: string | null; [key: string]: any };
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceMatrix {
  id: string;
  vehicleTypeId: string;
  serviceId: string;
  price: string;
  durationMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string | { ka: string; en: string; [key: string]: string };
  address: string | null | { ka: string | null; en: string | null; [key: string]: any };
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WashingBay {
  id: string;
  name: string;
  isActive: boolean;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber?: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  appleId?: string | null;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingServiceItem {
  serviceId: string;
  price: string;
  durationMinutes: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  customerId: string;
  washingBayId: string;
  branchId: string;
  vehicleTypeId: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  totalPrice: string;
  paymentMethod: "on_site" | "card_online";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  services: BookingServiceItem[]; // Embedded service line items
}

export interface SmsVerification {
  id: string;
  phoneNumber: string;
  otpCode: string;
  expiresAt: string; // ISO String
  isVerified: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "manager";
  createdAt?: string;
  updatedAt?: string;
}
