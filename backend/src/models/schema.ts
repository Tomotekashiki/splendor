import { pgTable, uuid, varchar, integer, boolean, timestamp, decimal, text, primaryKey, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Vehicle Types
export const vehicleTypes = pgTable("vehicle_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 2. Services
export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  isAddon: boolean("is_addon").default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 3. Service Matrix (Prices and Durations depending on Vehicle Type + Service combo)
export const serviceMatrix = pgTable("service_matrix", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleTypeId: uuid("vehicle_type_id")
    .notNull()
    .references(() => vehicleTypes.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.vehicleTypeId, t.serviceId),
}));

// 3.5. Branches
export const branches = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  address: varchar("address", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 4. Washing Bays (Boxes)
export const washingBays = pgTable("washing_bays", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 5. Customers
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  name: varchar("name", { length: 100 }).notNull(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 100 }).unique(),
  appleId: varchar("apple_id", { length: 100 }).unique(),
  licensePlate: varchar("license_plate", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 6. Bookings
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: varchar("booking_id", { length: 20 }).notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  washingBayId: uuid("washing_bay_id")
    .notNull()
    .references(() => washingBays.id, { onDelete: "restrict" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" }),
  vehicleTypeId: uuid("vehicle_type_id")
    .notNull()
    .references(() => vehicleTypes.id, { onDelete: "restrict" }),
  licensePlate: varchar("license_plate", { length: 20 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // 'on_site', 'card_online'
  paymentStatus: varchar("payment_status", { length: 30 }).default("unpaid").notNull(), // 'unpaid', 'paid', 'refunded', 'failed'
  status: varchar("status", { length: 30 }).default("pending").notNull(), // 'pending', 'in_progress', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 7. Booking Services (Line items for each booking)
export const bookingServices = pgTable("booking_services", {
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookingId, t.serviceId] }),
}));

// 8. SMS Verifications
export const smsVerifications = pgTable("sms_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Relationships definitions for easy Drizzle querying
export const vehicleTypesRelations = relations(vehicleTypes, ({ many }) => ({
  matrices: many(serviceMatrix),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  matrices: many(serviceMatrix),
  bookingServices: many(bookingServices),
}));

export const serviceMatrixRelations = relations(serviceMatrix, ({ one }) => ({
  vehicleType: one(vehicleTypes, {
    fields: [serviceMatrix.vehicleTypeId],
    references: [vehicleTypes.id],
  }),
  service: one(services, {
    fields: [serviceMatrix.serviceId],
    references: [services.id],
  }),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  washingBays: many(washingBays),
  bookings: many(bookings),
}));

export const washingBaysRelations = relations(washingBays, ({ one, many }) => ({
  branch: one(branches, {
    fields: [washingBays.branchId],
    references: [branches.id],
  }),
  bookings: many(bookings),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  washingBay: one(washingBays, {
    fields: [bookings.washingBayId],
    references: [washingBays.id],
  }),
  branch: one(branches, {
    fields: [bookings.branchId],
    references: [branches.id],
  }),
  vehicleType: one(vehicleTypes, {
    fields: [bookings.vehicleTypeId],
    references: [vehicleTypes.id],
  }),
  bookingServices: many(bookingServices),
}));

export const bookingServicesRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingServices.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [bookingServices.serviceId],
    references: [services.id],
  }),
}));

// 9. Users (Admin and Manager Accounts)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).default("manager").notNull(), // 'admin' | 'manager'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
