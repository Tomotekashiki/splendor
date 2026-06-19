import { fb } from "./firebase.js";
import { hashPassword } from "../services/password.service.js";
import crypto from "crypto";

async function main() {
  console.log("🌱 Starting Firebase Realtime Database seeding...");

  try {
    // 1. Clear existing database collections (only the keys we manage)
    console.log("Clearing existing database paths...");
    await fb.remove("vehicle_types");
    await fb.remove("services");
    await fb.remove("service_matrix");
    await fb.remove("branches");
    await fb.remove("washing_bays");
    await fb.remove("users");
    await fb.remove("bookings");
    await fb.remove("customers");
    await fb.remove("sms_verifications");

    // 2. Generate UUIDs for references
    const sedanId = crypto.randomUUID();
    const suvId = crypto.randomUUID();
    const minivanId = crypto.randomUUID();

    const standardId = crypto.randomUUID();
    const premiumId = crypto.randomUUID();
    const dryCleaningId = crypto.randomUUID();
    const engineWashId = crypto.randomUUID();
    const ceramicCoatingId = crypto.randomUUID();

    const saburtaloId = crypto.randomUUID();
    const vakeId = crypto.randomUUID();
    const gldaniId = crypto.randomUUID();

    const bay1Id = crypto.randomUUID();
    const bay2Id = crypto.randomUUID();
    const bay3Id = crypto.randomUUID();

    const adminId = crypto.randomUUID();
    const managerId = crypto.randomUUID();

    const now = new Date().toISOString();

    // 3. Seed Vehicle Types
    console.log("Seeding vehicle types...");
    const vehicleTypesData = {
      [sedanId]: { id: sedanId, name: "Sedan", displayOrder: 1, createdAt: now, updatedAt: now },
      [suvId]: { id: suvId, name: "SUV/Jeep", displayOrder: 2, createdAt: now, updatedAt: now },
      [minivanId]: { id: minivanId, name: "Minivan", displayOrder: 3, createdAt: now, updatedAt: now },
    };
    await fb.set("vehicle_types", vehicleTypesData);

    // 4. Seed Services
    console.log("Seeding services...");
    const servicesData = {
      [standardId]: {
        id: standardId,
        title: { ka: "სტანდარტული რეცხვა", en: "Standard Wash" },
        isAddon: false,
        description: {
          ka: "ექსტერიერის რეცხვა, სალონის მტვერსასრუტით გაწმენდა, მინების გაწმენდა და საბურავების გაშავება.",
          en: "Exterior wash, interior vacuuming, window cleaning, and tire shine."
        },
        createdAt: now,
        updatedAt: now
      },
      [premiumId]: {
        id: premiumId,
        title: { ka: "პრემიუმ რეცხვა", en: "Premium Wash" },
        isAddon: false,
        description: {
          ka: "სტანდარტული რეცხვა + თხევადი ცვილის დატანება, პანელის გაპრიალება და კარის ღიობების გაწმენდა.",
          en: "Standard wash plus liquid wax treatment, dashboard polish, and door jambs cleaning."
        },
        createdAt: now,
        updatedAt: now
      },
      [dryCleaningId]: {
        id: dryCleaningId,
        title: { ka: "ქიმწმენდა", en: "Dry Cleaning" },
        isAddon: false,
        description: {
          ka: "სალონის ღრმა ქიმიური წმენდა, ლაქების მოშორება და უსიამოვნო სუნის ნეიტრალიზაცია (საჭიროებს დამატებით დროს).",
          en: "Deep chemical interior dry cleaning, stain removal, and odor elimination (requires extra time)."
        },
        createdAt: now,
        updatedAt: now
      },
      [engineWashId]: {
        id: engineWashId,
        title: { ka: "ძრავის რეცხვა", en: "Engine Wash" },
        isAddon: true,
        description: {
          ka: "ძრავის განყოფილების პროფესიონალური ორთქლით რეცხვა სპეციალური ხსნარებით.",
          en: "Professional steam wash of the engine compartment with degreasers."
        },
        createdAt: now,
        updatedAt: now
      },
      [ceramicCoatingId]: {
        id: ceramicCoatingId,
        title: { ka: "კერამიკული დაცვა", en: "Ceramic Coating" },
        isAddon: true,
        description: {
          ka: "დამცავი კერამიკული საფარი გრძელვადიანი ბზინვარებისა და ჰიდროფობიურობისთვის.",
          en: "Protective ceramic coating layer for long-lasting gloss and hydrophobicity."
        },
        createdAt: now,
        updatedAt: now
      },
    };
    await fb.set("services", servicesData);

    // 5. Seed Service Matrix (Prices & Durations)
    console.log("Seeding service matrix (pricing/durations)...");
    const m1 = crypto.randomUUID();
    const m2 = crypto.randomUUID();
    const m3 = crypto.randomUUID();
    const m4 = crypto.randomUUID();
    const m5 = crypto.randomUUID();
    const m6 = crypto.randomUUID();
    const m7 = crypto.randomUUID();
    const m8 = crypto.randomUUID();
    const m9 = crypto.randomUUID();
    const m10 = crypto.randomUUID();
    const m11 = crypto.randomUUID();
    const m12 = crypto.randomUUID();
    const m13 = crypto.randomUUID();
    const m14 = crypto.randomUUID();
    const m15 = crypto.randomUUID();

    const matrixData = {
      [m1]: { id: m1, vehicleTypeId: sedanId, serviceId: standardId, price: "20.00", durationMinutes: 30, createdAt: now, updatedAt: now },
      [m2]: { id: m2, vehicleTypeId: suvId, serviceId: standardId, price: "30.00", durationMinutes: 45, createdAt: now, updatedAt: now },
      [m3]: { id: m3, vehicleTypeId: minivanId, serviceId: standardId, price: "35.00", durationMinutes: 50, createdAt: now, updatedAt: now },

      [m4]: { id: m4, vehicleTypeId: sedanId, serviceId: premiumId, price: "35.00", durationMinutes: 50, createdAt: now, updatedAt: now },
      [m5]: { id: m5, vehicleTypeId: suvId, serviceId: premiumId, price: "45.00", durationMinutes: 65, createdAt: now, updatedAt: now },
      [m6]: { id: m6, vehicleTypeId: minivanId, serviceId: premiumId, price: "50.00", durationMinutes: 70, createdAt: now, updatedAt: now },

      [m7]: { id: m7, vehicleTypeId: sedanId, serviceId: dryCleaningId, price: "100.00", durationMinutes: 180, createdAt: now, updatedAt: now },
      [m8]: { id: m8, vehicleTypeId: suvId, serviceId: dryCleaningId, price: "120.00", durationMinutes: 210, createdAt: now, updatedAt: now },
      [m9]: { id: m9, vehicleTypeId: minivanId, serviceId: dryCleaningId, price: "140.00", durationMinutes: 240, createdAt: now, updatedAt: now },

      [m10]: { id: m10, vehicleTypeId: sedanId, serviceId: engineWashId, price: "15.00", durationMinutes: 20, createdAt: now, updatedAt: now },
      [m11]: { id: m11, vehicleTypeId: suvId, serviceId: engineWashId, price: "20.00", durationMinutes: 25, createdAt: now, updatedAt: now },
      [m12]: { id: m12, vehicleTypeId: minivanId, serviceId: engineWashId, price: "20.00", durationMinutes: 25, createdAt: now, updatedAt: now },

      [m13]: { id: m13, vehicleTypeId: sedanId, serviceId: ceramicCoatingId, price: "200.00", durationMinutes: 120, createdAt: now, updatedAt: now },
      [m14]: { id: m14, vehicleTypeId: suvId, serviceId: ceramicCoatingId, price: "250.00", durationMinutes: 150, createdAt: now, updatedAt: now },
      [m15]: { id: m15, vehicleTypeId: minivanId, serviceId: ceramicCoatingId, price: "280.00", durationMinutes: 150, createdAt: now, updatedAt: now },
    };
    await fb.set("service_matrix", matrixData);

    // 6. Seed Branches
    console.log("Seeding branches...");
    const branchesData = {
      [saburtaloId]: { id: saburtaloId, name: "საბურთალოს ფილიალი", address: "ვაჟა-ფშაველას გამზ. 45", isActive: true, createdAt: now, updatedAt: now },
      [vakeId]: { id: vakeId, name: "ვაკის ფილიალი", address: "ჭავჭავაძის გამზ. 22", isActive: true, createdAt: now, updatedAt: now },
      [gldaniId]: { id: gldaniId, name: "გლდანის ფილიალი", address: "ხიზანიშვილის ქ. 12", isActive: true, createdAt: now, updatedAt: now },
    };
    await fb.set("branches", branchesData);

    // 7. Seed Washing Bays
    console.log("Seeding washing bays linked to branches...");
    const baysData = {
      [bay1Id]: { id: bay1Id, name: "Box 1", isActive: true, branchId: saburtaloId, createdAt: now, updatedAt: now },
      [bay2Id]: { id: bay2Id, name: "Box 2", isActive: true, branchId: vakeId, createdAt: now, updatedAt: now },
      [bay3Id]: { id: bay3Id, name: "Box 3", isActive: true, branchId: gldaniId, createdAt: now, updatedAt: now },
    };
    await fb.set("washing_bays", baysData);

    // 8. Seed Users
    console.log("Seeding default users...");
    const adminPasswordHash = hashPassword("admin");
    const managerPasswordHash = hashPassword("manager");
    
    const usersData = {
      [adminId]: { id: adminId, username: "admin", passwordHash: adminPasswordHash, role: "admin", createdAt: now, updatedAt: now },
      [managerId]: { id: managerId, username: "manager", passwordHash: managerPasswordHash, role: "manager", createdAt: now, updatedAt: now },
    };
    await fb.set("users", usersData);

    // 9. Seed Test Customer
    console.log("Seeding test customer...");
    const testCustomerId = crypto.randomUUID();
    const customerPasswordHash = hashPassword("password123");
    const customersData = {
      [testCustomerId]: {
        id: testCustomerId,
        name: "სატესტო მომხმარებელი",
        phoneNumber: "+995555111111",
        passwordHash: customerPasswordHash,
        createdAt: now,
        updatedAt: now
      }
    };
    await fb.set("customers", customersData);

    console.log("✅ Firebase seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Firebase seeding failed:", error);
    process.exit(1);
  }
}

main();
