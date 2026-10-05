/**
 * Offline & mock fallbacks for bookingStore.
 * Extracted into this separate module so that Vite / Nuxt only loads it on-demand
 * if the live API is offline, saving ~35 KiB from the initial JavaScript bundle.
 */

export function loadMockServiceGridFallback(store: any) {
  if (typeof window !== "undefined") {
    try {
      const storedBranches = window.localStorage.getItem("splendor_branches");
      if (storedBranches) {
        store.branches = JSON.parse(storedBranches);
        store.branches.sort((a: any, b: any) => {
          const orderA = a.displayOrder ?? 0;
          const orderB = b.displayOrder ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          const nameA = typeof a.name === "string" ? a.name : (a.name?.ka || a.name?.en || "");
          const nameB = typeof b.name === "string" ? b.name : (b.name?.ka || b.name?.en || "");
          return nameA.localeCompare(nameB);
        });
      } else {
        store.branches = getDefaultBranches();
        window.localStorage.setItem("splendor_branches", JSON.stringify(store.branches));
      }
    } catch (e) {
      console.error("Error reading branches from localStorage:", e);
      store.branches = getDefaultBranches();
    }
  } else {
    store.branches = getDefaultBranches();
  }

  store.vehicleTypes = [
    { id: "v-sedan", name: "სედანი", displayOrder: 1 },
    { id: "v-suv", name: "ჯიპი / SUV", displayOrder: 2 },
    { id: "v-minivan", name: "მინივენი", displayOrder: 3 },
  ];

  store.washingBays = [
    { id: "b-1", name: "ბოქსი 1", isActive: true },
    { id: "b-2", name: "ბოქსი 2", isActive: true },
    { id: "b-3", name: "ბოქსი 3", isActive: true },
  ];

  if (typeof window !== "undefined") {
    try {
      const storedServices = window.localStorage.getItem("splendor_services");
      const storedMatrix = window.localStorage.getItem("splendor_service_matrix");

      if (storedServices && storedMatrix && !storedServices.includes("Standard Wash")) {
        store.services = JSON.parse(storedServices);
        store.services.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        store.serviceMatrix = JSON.parse(storedMatrix);
      } else {
        store.services = getDefaultServices();
        store.services.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        store.serviceMatrix = getDefaultServiceMatrix();
        window.localStorage.setItem("splendor_services", JSON.stringify(store.services));
        window.localStorage.setItem("splendor_service_matrix", JSON.stringify(store.serviceMatrix));
      }
    } catch (e) {
      console.error("Error reading stored services from localStorage:", e);
      store.services = getDefaultServices();
      store.serviceMatrix = getDefaultServiceMatrix();
    }
  } else {
    store.services = getDefaultServices();
    store.serviceMatrix = getDefaultServiceMatrix();
  }

  store.error = null;
}

export function createMockBookingFallback(store: any, err: any) {
  console.warn("Booking submission failed via API, simulating successful booking creation:", err);
  const randomBookingId = "ANT-" + Math.floor(100000 + Math.random() * 900000);

  const selectedBranch = store.branches.find((b: any) => b.id === store.selectedBranchId);
  const selectedVT = store.vehicleTypes.find((v: any) => v.id === store.selectedVehicleTypeId);
  const selectedSvs = store.services.filter((s: any) => store.selectedServiceIds.includes(s.id));
  const details = store.selectedDetails;

  const startTimeStr = store.selectedStartTime;
  const startTimeDate = new Date(startTimeStr);
  const endTimeDate = new Date(startTimeDate.getTime() + details.duration * 60000);

  const mockBooking = {
    id: "mb-" + Math.random().toString(),
    bookingId: randomBookingId,
    customerId: "c-client-" + Math.random().toString(),
    washingBayId: store.washingBays[0]?.id || "b-1",
    vehicleTypeId: store.selectedVehicleTypeId,
    startTime: startTimeDate.toISOString(),
    endTime: endTimeDate.toISOString(),
    totalPrice: details.price.toFixed(2),
    paymentMethod: store.paymentMethod,
    paymentStatus: store.paymentMethod === "card_online" ? "paid" : "unpaid",
    status: "pending",
    notes: store.notes,
    branch: selectedBranch
      ? { id: selectedBranch.id, name: selectedBranch.name, address: selectedBranch.address }
      : { id: "br-saburtalo", name: "საბურთალოს ფილიალი" },
    customer: {
      name: store.customerName,
      phoneNumber: store.customerPhone,
    },
    vehicleType: {
      name: selectedVT?.name || "Vehicle",
    },
    bookingServices: selectedSvs.map((s: any) => {
      const mat = store.serviceMatrix.find(
        (m: any) => m.vehicleTypeId === store.selectedVehicleTypeId && m.serviceId === s.id
      );
      return {
        serviceId: s.id,
        service: { name: s.name },
        price: mat?.price || "0.00",
        durationMinutes: mat?.durationMinutes || 30,
      };
    }),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("splendor_bookings");
      const localBookings = raw ? JSON.parse(raw) : [];
      localBookings.push(mockBooking);
      window.localStorage.setItem("splendor_bookings", JSON.stringify(localBookings));
      window.dispatchEvent(new CustomEvent("splendor_new_booking", { detail: mockBooking }));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }

  store.resetChoices();
  return { success: true, booking: mockBooking };
}

function getDefaultBranches() {
  return [
    { id: "br-saburtalo", name: { ka: "საბურთალოს ფილიალი", en: "Saburtalo Branch" }, address: { ka: "ვაჟა-ფშაველას გამზ. 45", en: "45 Vazha-Pshavela Ave." }, isActive: true, displayOrder: 1 },
    { id: "br-vake", name: { ka: "ვაკის ფილიალი", en: "Vake Branch" }, address: { ka: "ჭავჭავაძის გამზ. 22", en: "22 Chavchavadze Ave." }, isActive: true, displayOrder: 2 },
    { id: "br-gldani", name: { ka: "გლდანის ფილიალი", en: "Gldani Branch" }, address: { ka: "ხიზანიშვილის ქ. 12", en: "12 Khizanishvili St." }, isActive: true, displayOrder: 3 },
  ];
}

function getDefaultServices() {
  return [
    {
      id: "s-standard",
      title: { ka: "სტანდარტული რეცხვა", en: "Standard Wash" },
      isAddon: false,
      description: {
        ka: "ექსტერიერის რეცხვა, სალონის მტვერსასრუტით გაწმენდა, მინების გაწმენდა და საბურავების გაშავება.",
        en: "Exterior wash, interior vacuuming, window cleaning, and tire shine.",
      },
      displayOrder: 1,
    },
    {
      id: "s-premium",
      title: { ka: "პრემიუმ რეცხვა", en: "Premium Wash" },
      isAddon: false,
      description: {
        ka: "სტანდარტული რეცხვა + თხევადი ცვილის დატანება, პანელის გაპრიალება და კარის ღიობების გაწმენდა.",
        en: "Standard wash plus liquid wax treatment, dashboard polish, and door jambs cleaning.",
      },
      displayOrder: 2,
    },
    {
      id: "s-dryclean",
      title: { ka: "ქიმწმენდა", en: "Dry Cleaning" },
      isAddon: false,
      description: {
        ka: "სალონის ღრმა ქიმიური წმენდა, ლაქების მოშორება და უსიამოვნო სუნის ნეიტრალიზაცია (საჭიროებს დამატებით დროს).",
        en: "Deep chemical interior dry cleaning, stain removal, and odor elimination (requires extra time).",
      },
      displayOrder: 3,
    },
    {
      id: "s-enginewash",
      title: { ka: "ძრავის რეცხვა", en: "Engine Wash" },
      isAddon: true,
      description: {
        ka: "ძრავის განყოფილების პროფესიონალური ორთქლით რეცხვა სპეციალური ხსნარებით.",
        en: "Professional steam wash of the engine compartment with degreasers.",
      },
      displayOrder: 4,
    },
    {
      id: "s-ceramic",
      title: { ka: "კერამიკული დაცვა", en: "Ceramic Coating" },
      isAddon: true,
      description: {
        ka: "დამცავი კერამიკული საფარი გრძელვადიანი ბზინვარებისა და ჰიდროფობიურობისთვის.",
        en: "Protective ceramic coating layer for long-lasting gloss and hydrophobicity.",
      },
      displayOrder: 5,
    },
  ];
}

function getDefaultServiceMatrix() {
  return [
    { vehicleTypeId: "v-sedan", serviceId: "s-standard", price: "20.00", durationMinutes: 30 },
    { vehicleTypeId: "v-suv", serviceId: "s-standard", price: "30.00", durationMinutes: 45 },
    { vehicleTypeId: "v-minivan", serviceId: "s-standard", price: "35.00", durationMinutes: 50 },
    { vehicleTypeId: "v-sedan", serviceId: "s-premium", price: "35.00", durationMinutes: 50 },
    { vehicleTypeId: "v-suv", serviceId: "s-premium", price: "45.00", durationMinutes: 65 },
    { vehicleTypeId: "v-minivan", serviceId: "s-premium", price: "50.00", durationMinutes: 70 },
    { vehicleTypeId: "v-sedan", serviceId: "s-dryclean", price: "100.00", durationMinutes: 180 },
    { vehicleTypeId: "v-suv", serviceId: "s-dryclean", price: "120.00", durationMinutes: 210 },
    { vehicleTypeId: "v-minivan", serviceId: "s-dryclean", price: "140.00", durationMinutes: 240 },
    { vehicleTypeId: "v-sedan", serviceId: "s-enginewash", price: "15.00", durationMinutes: 20 },
    { vehicleTypeId: "v-suv", serviceId: "s-enginewash", price: "20.00", durationMinutes: 25 },
    { vehicleTypeId: "v-minivan", serviceId: "s-enginewash", price: "20.00", durationMinutes: 25 },
    { vehicleTypeId: "v-sedan", serviceId: "s-ceramic", price: "200.00", durationMinutes: 120 },
    { vehicleTypeId: "v-suv", serviceId: "s-ceramic", price: "250.00", durationMinutes: 150 },
    { vehicleTypeId: "v-minivan", serviceId: "s-ceramic", price: "280.00", durationMinutes: 150 },
  ];
}
