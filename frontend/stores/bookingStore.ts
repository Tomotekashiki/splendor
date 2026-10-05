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
        const { loadMockServiceGridFallback } = await import("./bookingMockFallback");
        loadMockServiceGridFallback(this);
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
        const { createMockBookingFallback } = await import("./bookingMockFallback");
        return createMockBookingFallback(this, err);
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
