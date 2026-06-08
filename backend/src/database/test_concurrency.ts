import { fb } from './firebase.js';
import { BookingService } from '../services/booking.service.js';
import { Booking, WashingBay, VehicleType } from '../models/types.js';

async function runTest() {
  console.log("🧪 Starting Firebase concurrency & transaction slot safety test...");

  try {
    // 1. Fetch prerequisite records
    const vTypesObj = await fb.get("vehicle_types") || {};
    const vType = Object.values(vTypesObj)[0] as VehicleType | undefined;

    const baysObj = await fb.get("washing_bays") || {};
    const bay = Object.values(baysObj)[0] as WashingBay | undefined;
    
    if (!vType || !bay) {
      console.error("❌ Seed data missing! Run npm run db:seed first.");
      process.exit(1);
    }

    console.log(`Using washing bay: ${bay.name} (ID: ${bay.id})`);
    console.log(`Targeting slot: Today 14:00 - 14:45`);

    // Clean any prior bookings for test slot
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0);

    // Fetch all bookings and clear any test bookings for this bay
    const bookingsObj = await fb.get("bookings") || {};
    for (const key of Object.keys(bookingsObj)) {
      if (bookingsObj[key].washingBayId === bay.id) {
        await fb.remove(`bookings/${key}`);
      }
    }

    console.log("Firing two overlapping bookings simultaneously...");

    // Send two overlapping insertions in parallel
    const p1 = BookingService.createBooking({
      name: "User A",
      phoneNumber: "+995555111111",
      vehicleTypeId: vType.id,
      serviceIds: [Object.keys(await fb.get("services"))[0]], // first service
      startTime,
      washingBayId: bay.id,
      paymentMethod: "on_site",
      branchId: bay.branchId,
    });

    const p2 = BookingService.createBooking({
      name: "User B",
      phoneNumber: "+995555222222",
      vehicleTypeId: vType.id,
      serviceIds: [Object.keys(await fb.get("services"))[0]],
      startTime,
      washingBayId: bay.id,
      paymentMethod: "on_site",
      branchId: bay.branchId,
    });

    const results = await Promise.allSettled([p1, p2]);

    let successCount = 0;
    let failureCount = 0;

    results.forEach((res, index) => {
      const label = index === 0 ? "Booking A" : "Booking B";
      if (res.status === "fulfilled") {
        console.log(`✅ ${label} succeeded!`);
        successCount++;
      } else {
        console.log(`❌ ${label} failed as expected!`);
        console.log(`   Reason: ${res.reason.message}`);
        failureCount++;
      }
    });

    if (successCount === 1 && failureCount === 1) {
      console.log("\n🎉 CONCURRENCY TEST PASSED!");
      console.log("Firebase transaction successfully allowed exactly one booking and rejected the double-booking attempt!");
    } else {
      console.log("\n⚠️ CONCURRENCY TEST FAILED!");
      console.log(`Success count: ${successCount}, Failures: ${failureCount}`);
    }

  } catch (err: any) {
    console.error("Test execution crashed:", err);
  } finally {
    // Cleanup test bookings
    const baysObj = await fb.get("washing_bays") || {};
    const bay = Object.values(baysObj)[0] as WashingBay | undefined;
    if (bay) {
      const bookingsObj = await fb.get("bookings") || {};
      for (const key of Object.keys(bookingsObj)) {
        if (bookingsObj[key].washingBayId === bay.id) {
          await fb.remove(`bookings/${key}`);
        }
      }
    }
    console.log("🧹 Test cleanup completed.");
    process.exit(0);
  }
}

runTest();
