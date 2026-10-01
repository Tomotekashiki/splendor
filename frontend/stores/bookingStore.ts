import { defineStore } from "pinia";
import { useCustomerAuthStore } from "./customerAuthStore";

export const useBookingStore = defineStore("bookingStore", {
  state: () => ({
    // Metadata loaded from API
    vehicleTypes: [] as any[],
    services: [] as any[],
    serviceMatrix: [] as any[],
    washingBays: [] as any[],

    // Selected choices
    selectedVehicleTypeId: "" as string,
    selectedServiceIds: [] as string[],
    selectedDate: "" as string, // YYYY-MM-DD
    selectedStartTime: "" as string, // ISO string

    // Contact info
    customerName: "" as string,
    customerPhone: "" as string,
    notes: "" as string,
    licensePlate: "" as string,
    carMake: "" as string,
    carModel: "" as string,

    // Step state
    otpCode: "" as string,
    otpSent: false,
    otpVerified: false,
    paymentMethod: "on_site" as "on_site" | "card_online",
    cardNumber: "" as string,

    selectedBranchId: "" as string,
    branches: [] as any[],

    // Availability slots
    availableSlots: [] as string[],
    loadingSlots: false,
    loadingGrid: false,
    error: null as string | null,
  }),

  getters: {
    selectedVehicleType(state) {
      return state.vehicleTypes.find((t) => t.id === state.selectedVehicleTypeId);
    },
    
    // Calculates prices and durations based on selected type and services
    selectedDetails(state) {
      if (!state.selectedVehicleTypeId || state.selectedServiceIds.length === 0) {
        return { price: 0, duration: 0, items: [] };
      }

      const activeItems = state.serviceMatrix.filter(
        (m) =>
          m.vehicleTypeId === state.selectedVehicleTypeId &&
          state.selectedServiceIds.includes(m.serviceId)
      );

      const price = activeItems.reduce((sum, m) => sum + parseFloat(m.price), 0);
      // const duration = activeItems.reduce((sum, m) => sum + m.durationMinutes, 0);
      const duration = 30; // Temporarily fixed duration (independent of service duration)

      const items = activeItems.map((m) => {
        const baseService = state.services.find((s) => s.id === m.serviceId);
        return {
          id: m.serviceId,
          name: baseService?.title || baseService?.name || "Service",
          isAddon: baseService?.isAddon || false,
          price: parseFloat(m.price),
          duration: m.durationMinutes,
        };
      });

      return { price, duration, items };
    },
  },

  actions: {
    async loadServiceGrid() {
      this.loadingGrid = true;
      try {
        const config = useRuntimeConfig();
        const data: any = await $fetch(`${config.public.apiBase}/services`);
        
        this.vehicleTypes = data.vehicleTypes;
        this.services = data.services || [];
        this.services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        this.serviceMatrix = data.serviceMatrix;
        this.washingBays = data.washingBays;
        this.branches = data.branches || [];
        this.branches.sort((a, b) => {
          const orderA = a.displayOrder ?? 0;
          const orderB = b.displayOrder ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          const nameA = typeof a.name === 'string' ? a.name : (a.name?.ka || a.name?.en || '');
          const nameB = typeof b.name === 'string' ? b.name : (b.name?.ka || b.name?.en || '');
          return nameA.localeCompare(nameB);
        });

        // No auto-select default vehicle type
      } catch (err: any) {
        console.warn("API offline. Loading mock service grid fallbacks:", err);
        
        if (typeof window !== "undefined") {
          try {
            const storedBranches = window.localStorage.getItem("splendor_branches");
            if (storedBranches) {
              this.branches = JSON.parse(storedBranches);
              this.branches.sort((a, b) => {
                const orderA = a.displayOrder ?? 0;
                const orderB = b.displayOrder ?? 0;
                if (orderA !== orderB) return orderA - orderB;
                const nameA = typeof a.name === 'string' ? a.name : (a.name?.ka || a.name?.en || '');
                const nameB = typeof b.name === 'string' ? b.name : (b.name?.ka || b.name?.en || '');
                return nameA.localeCompare(nameB);
              });
            } else {
              this.branches = [
                { id: "br-saburtalo", name: { ka: "საბურთალოს ფილიალი", en: "Saburtalo Branch" }, address: { ka: "ვაჟა-ფშაველას გამზ. 45", en: "45 Vazha-Pshavela Ave." }, isActive: true, displayOrder: 1 },
                { id: "br-vake", name: { ka: "ვაკის ფილიალი", en: "Vake Branch" }, address: { ka: "ჭავჭავაძის გამზ. 22", en: "22 Chavchavadze Ave." }, isActive: true, displayOrder: 2 },
                { id: "br-gldani", name: { ka: "გლდანის ფილიალი", en: "Gldani Branch" }, address: { ka: "ხიზანიშვილის ქ. 12", en: "12 Khizanishvili St." }, isActive: true, displayOrder: 3 },
              ];
              window.localStorage.setItem("splendor_branches", JSON.stringify(this.branches));
            }
          } catch (e) {
            console.error("Error reading branches from localStorage:", e);
            this.branches = [
              { id: "br-saburtalo", name: { ka: "საბურთალოს ფილიალი", en: "Saburtalo Branch" }, address: { ka: "ვაჟა-ფშაველას გამზ. 45", en: "45 Vazha-Pshavela Ave." }, isActive: true },
              { id: "br-vake", name: { ka: "ვაკის ფილიალი", en: "Vake Branch" }, address: { ka: "ჭავჭავაძის გამზ. 22", en: "22 Chavchavadze Ave." }, isActive: true },
              { id: "br-gldani", name: { ka: "გლდანის ფილიალი", en: "Gldani Branch" }, address: { ka: "ხიზანიშვილის ქ. 12", en: "12 Khizanishvili St." }, isActive: true },
            ];
          }
        } else {
          this.branches = [
            { id: "br-saburtalo", name: { ka: "საბურთალოს ფილიალი", en: "Saburtalo Branch" }, address: { ka: "ვაჟა-ფშაველას გამზ. 45", en: "45 Vazha-Pshavela Ave." }, isActive: true },
            { id: "br-vake", name: { ka: "ვაკის ფილიალი", en: "Vake Branch" }, address: { ka: "ჭავჭავაძის გამზ. 22", en: "22 Chavchavadze Ave." }, isActive: true },
            { id: "br-gldani", name: { ka: "გლდანის ფილიალი", en: "Gldani Branch" }, address: { ka: "ხიზანიშვილის ქ. 12", en: "12 Khizanishvili St." }, isActive: true },
          ];
        }
        
        this.vehicleTypes = [
          { id: "v-sedan", name: "სედანი", displayOrder: 1 },
          { id: "v-suv", name: "ჯიპი / SUV", displayOrder: 2 },
          { id: "v-minivan", name: "მინივენი", displayOrder: 3 },
        ];
        this.washingBays = [
          { id: "b-1", name: "បոქსი 1", isActive: true },
          { id: "b-2", name: "បოქსი 2", isActive: true },
          { id: "b-3", name: "បოქსი 3", isActive: true },
        ];

        // Ensure washing bay names are in Georgian too: "ბოქსი 1", etc.
        this.washingBays = [
          { id: "b-1", name: "ბოქსი 1", isActive: true },
          { id: "b-2", name: "ბოქსი 2", isActive: true },
          { id: "b-3", name: "ბოქსი 3", isActive: true },
        ];

        if (typeof window !== "undefined") {
          try {
            const storedServices = window.localStorage.getItem("splendor_services");
            const storedMatrix = window.localStorage.getItem("splendor_service_matrix");
            
            if (storedServices && storedMatrix && !storedServices.includes("Standard Wash")) {
              this.services = JSON.parse(storedServices);
              this.services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
              this.serviceMatrix = JSON.parse(storedMatrix);
            } else {
              this.services = [
                {
                  id: "s-standard",
                  title: { ka: "სტანდარტული რეცხვა", en: "Standard Wash" },
                  isAddon: false,
                  description: {
                    ka: "ექსტერიერის რეცხვა, სალონის მტვერსასრუტით გაწმენდა, მინების გაწმენდა და საბურავების გაშავება.",
                    en: "Exterior wash, interior vacuuming, window cleaning, and tire shine."
                  },
                  displayOrder: 1
                },
                {
                  id: "s-premium",
                  title: { ka: "პრემიუმ რეცხვა", en: "Premium Wash" },
                  isAddon: false,
                  description: {
                    ka: "სტანდარტული რეცხვა + თხევადი ცვილის დატანება, პანელის გაპრიალება და კარის ღიობების გაწმენდა.",
                    en: "Standard wash plus liquid wax treatment, dashboard polish, and door jambs cleaning."
                  },
                  displayOrder: 2
                },
                {
                  id: "s-dryclean",
                  title: { ka: "ქიმწმენდა", en: "Dry Cleaning" },
                  isAddon: false,
                  description: {
                    ka: "სალონის ღრმა ქიმიური წმენდა, ლაქების მოშორება და უსიამოვნო სუნის ნეიტრალიზაცია (საჭიროებს დამატებით დროს).",
                    en: "Deep chemical interior dry cleaning, stain removal, and odor elimination (requires extra time)."
                  },
                  displayOrder: 3
                },
                {
                  id: "s-enginewash",
                  title: { ka: "ძრავის რეცხვა", en: "Engine Wash" },
                  isAddon: true,
                  description: {
                    ka: "ძრავის განყოფილების პროფესიონალური ორთქლით რეცხვა სპეციალური ხსნარებით.",
                    en: "Professional steam wash of the engine compartment with degreasers."
                  },
                  displayOrder: 4
                },
                {
                  id: "s-ceramic",
                  title: { ka: "კერამიკული დაცვა", en: "Ceramic Coating" },
                  isAddon: true,
                  description: {
                    ka: "დამცავი კერამიკული საფარი გრძელვადიანი ბზინვარებისა და ჰიდროფობიურობისთვის.",
                    en: "Protective ceramic coating layer for long-lasting gloss and hydrophobicity."
                  },
                  displayOrder: 5
                },
              ];
              this.services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
              this.serviceMatrix = [
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
              window.localStorage.setItem("splendor_services", JSON.stringify(this.services));
              window.localStorage.setItem("splendor_service_matrix", JSON.stringify(this.serviceMatrix));
            }
          } catch (e) {
            console.error("Error reading stored services from localStorage:", e);
          }
        }

        // No auto-select default vehicle type fallback
        this.error = null;
      } finally {
        this.loadingGrid = false;
      }
    },

    async fetchAvailableSlots() {
      if (!this.selectedBranchId || !this.selectedDate || !this.selectedVehicleTypeId || this.selectedServiceIds.length === 0) {
        this.availableSlots = [];
        return;
      }

      this.loadingSlots = true;
      try {
        const config = useRuntimeConfig();
        const queryParams = new URLSearchParams({
          date: this.selectedDate,
          vehicleTypeId: this.selectedVehicleTypeId,
          serviceIds: this.selectedServiceIds.join(","),
          branchId: this.selectedBranchId,
        });

        const data: any = await $fetch(
          `${config.public.apiBase}/bookings/available-slots?${queryParams.toString()}`
        );
        this.availableSlots = data.slots;
      } catch (err: any) {
        console.warn("Failed to fetch available slots from API, loading mock available slots:", err);
        const { useSettingsStore } = await import("./settingsStore");
        const settingsStore = useSettingsStore();
        
        let branchHours = settingsStore.branchConfiguredHours[this.selectedBranchId];
        if (!branchHours || branchHours.length === 0) {
          if (typeof window !== "undefined") {
            const storedBranchHours = window.localStorage.getItem("splendor_branch_configured_hours");
            if (storedBranchHours) {
              const parsed = JSON.parse(storedBranchHours);
              branchHours = parsed[this.selectedBranchId];
            }
          }
        }

        let hours = (branchHours && branchHours.length > 0) ? branchHours : settingsStore.configuredHours;
        if (hours.length === 0) {
          if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem("splendor_configured_hours");
            hours = stored ? JSON.parse(stored) : [];
          }
        }
        if (hours.length === 0) {
          hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
        }

        const slots = [];
        const baseDate = new Date(this.selectedDate);
        for (const timeStr of hours) {
          const [hStr, mStr] = timeStr.split(":");
          const hour = parseInt(hStr);
          const min = parseInt(mStr);
          const time = new Date(baseDate);
          time.setUTCHours(hour, min, 0, 0);
          slots.push(time.toISOString());
        }
        this.availableSlots = slots;
      } finally {
        this.loadingSlots = false;
      }
    },

    async sendVerificationOtp() {
      const config = useRuntimeConfig();
      try {
        await $fetch(`${config.public.apiBase}/auth/send-otp`, {
          method: "POST",
          body: { phoneNumber: this.customerPhone },
        });
        this.otpSent = true;
        this.error = null;
        return true;
      } catch (err: any) {
        if (err.status && err.status >= 400 && err.status < 500) {
          this.error = err.data?.error || "Failed to send verification code.";
          return false;
        }
        console.warn("API offline. Simulating SMS dispatch:", err);
        this.otpSent = true;
        this.error = null;
        return true;
      }
    },

    async verifyOtp() {
      const config = useRuntimeConfig();
      try {
        await $fetch(`${config.public.apiBase}/auth/verify-otp`, {
          method: "POST",
          body: { phoneNumber: this.customerPhone, otpCode: this.otpCode },
        });
        this.otpVerified = true;
        this.error = null;
        return true;
      } catch (err: any) {
        if (err.status && err.status >= 400 && err.status < 500) {
          this.error = err.data?.error || "Invalid or expired verification code.";
          return false;
        }
        console.warn("API offline. Simulating successful verification:", err);
        this.otpVerified = true;
        this.error = null;
        return true;
      }
    },

    async submitBooking() {
      const config = useRuntimeConfig();
      const selectedBranch = this.branches.find(b => b.id === this.selectedBranchId);
      try {
        const body: any = {
          name: this.customerName,
          phoneNumber: this.customerPhone,
          vehicleTypeId: this.selectedVehicleTypeId,
          serviceIds: this.selectedServiceIds,
          startTime: this.selectedStartTime,
          paymentMethod: this.paymentMethod,
          notes: this.notes,
          branchId: this.selectedBranchId,
          licensePlate: this.licensePlate,
          carMake: this.carMake,
          carModel: this.carModel,
        };

        if (this.paymentMethod === "card_online") {
          body.cardNumber = this.cardNumber;
        }

        if (!this.otpVerified) {
          body.otpCode = this.otpCode;
        } else {
          body.otpCode = "0000"; 
          body.isAdminEntry = true;
        }

        const customerAuth = useCustomerAuthStore();
        const headers: any = {};
        if (customerAuth.token) {
          headers.Authorization = `Bearer ${customerAuth.token}`;
        }

        const data: any = await $fetch(`${config.public.apiBase}/bookings`, {
          method: "POST",
          headers,
          body,
        });

        this.resetChoices();
        return { success: true, booking: data.booking };
      } catch (err: any) {
        if (err.status && err.status >= 400) {
          this.error = err.data?.error || "Failed to submit booking.";
          return { success: false, error: this.error };
        }
        console.warn("Booking submission failed via API, simulating successful booking creation:", err);
        const randomBookingId = "ANT-" + Math.floor(100000 + Math.random() * 900000);
        
        const selectedVT = this.vehicleTypes.find(v => v.id === this.selectedVehicleTypeId);
        const selectedSvs = this.services.filter(s => this.selectedServiceIds.includes(s.id));
        const details = this.selectedDetails;
        
        const startTimeStr = this.selectedStartTime;
        const startTimeDate = new Date(startTimeStr);
        const endTimeDate = new Date(startTimeDate.getTime() + details.duration * 60000);

        const mockBooking = {
          id: "mb-" + Math.random().toString(),
          bookingId: randomBookingId,
          customerId: "c-client-" + Math.random().toString(),
          washingBayId: this.washingBays[0]?.id || "b-1",
          vehicleTypeId: this.selectedVehicleTypeId,
          startTime: startTimeDate.toISOString(),
          endTime: endTimeDate.toISOString(),
          totalPrice: details.price.toFixed(2),
          paymentMethod: this.paymentMethod,
          paymentStatus: this.paymentMethod === 'card_online' ? 'paid' : 'unpaid',
          status: 'pending',
          notes: this.notes,
          branch: selectedBranch ? { id: selectedBranch.id, name: selectedBranch.name, address: selectedBranch.address } : { id: "br-saburtalo", name: "საბურთალოს ფილიალი" },
          customer: {
            name: this.customerName,
            phoneNumber: this.customerPhone
          },
          vehicleType: {
            name: selectedVT?.name || "Vehicle"
          },
          bookingServices: selectedSvs.map(s => {
            const mat = this.serviceMatrix.find(
              m => m.vehicleTypeId === this.selectedVehicleTypeId && m.serviceId === s.id
            );
            return {
              serviceId: s.id,
              service: { name: s.name },
              price: mat?.price || "0.00",
              durationMinutes: mat?.durationMinutes || 30
            };
          })
        };

        if (typeof window !== 'undefined') {
          try {
            const raw = window.localStorage.getItem('splendor_bookings');
            const localBookings = raw ? JSON.parse(raw) : [];
            localBookings.push(mockBooking);
            window.localStorage.setItem('splendor_bookings', JSON.stringify(localBookings));
            window.dispatchEvent(new CustomEvent('splendor_new_booking', { detail: mockBooking }));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }

        this.resetChoices();
        return { success: true, booking: mockBooking };
      }
    },

    resetChoices() {
      this.selectedVehicleTypeId = "";
      this.selectedServiceIds = [];
      this.selectedDate = "";
      this.selectedStartTime = "";
      this.notes = "";
      this.licensePlate = "";
      this.carMake = "";
      this.carModel = "";
      this.otpCode = "";
      this.otpSent = false;
      this.otpVerified = false;
      this.cardNumber = "";
      this.selectedBranchId = "";

      const customerAuth = useCustomerAuthStore();
      if (customerAuth.customer) {
        this.customerName = customerAuth.customer.name || "";
        this.customerPhone = customerAuth.customer.phoneNumber || "";
      } else {
        this.customerName = "";
        this.customerPhone = "";
      }
    },
  },
});
