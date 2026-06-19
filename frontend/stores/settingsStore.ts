import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    smsGatewayKey: "",
    smsSenderName: "",
    calendarOverrides: {} as Record<string, "working" | "non_working">,
    configuredHours: [] as string[],
    branchConfiguredHours: {} as Record<string, string[]>,
    bookingWindowDays: 0,
    loading: false,
    error: null as string | null,
    successMessage: null as string | null,
  }),

  actions: {
    async fetchSettings() {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/settings`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        if (response && response.success) {
          this.smsGatewayKey = response.settings.smsGatewayKey;
          this.smsSenderName = response.settings.smsSenderName;
          this.configuredHours = response.settings.configuredHours || [];
          this.branchConfiguredHours = response.settings.branchConfiguredHours || {};
          this.bookingWindowDays = response.settings.bookingWindowDays || 0;
          // Sync to localStorage for offline fallback
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_sms_gateway_key", this.smsGatewayKey);
            window.localStorage.setItem("splendor_sms_sender_name", this.smsSenderName);
            window.localStorage.setItem("splendor_configured_hours", JSON.stringify(this.configuredHours));
            window.localStorage.setItem("splendor_branch_configured_hours", JSON.stringify(this.branchConfiguredHours));
            window.localStorage.setItem("splendor_booking_window_days", String(this.bookingWindowDays));
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch settings from API. Falling back to local copy.", err);
        if (typeof window !== "undefined") {
          this.smsGatewayKey = window.localStorage.getItem("splendor_sms_gateway_key") || "";
          this.smsSenderName = window.localStorage.getItem("splendor_sms_sender_name") || "";
          const storedHours = window.localStorage.getItem("splendor_configured_hours");
          this.configuredHours = storedHours ? JSON.parse(storedHours) : ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
          const storedBranchHours = window.localStorage.getItem("splendor_branch_configured_hours");
          this.branchConfiguredHours = storedBranchHours ? JSON.parse(storedBranchHours) : {};
          this.bookingWindowDays = Number(window.localStorage.getItem("splendor_booking_window_days") || "0");
        }
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(smsGatewayKey: string, smsSenderName: string, configuredHours?: string[], branchConfiguredHours?: Record<string, string[]>, bookingWindowDays?: number) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const hoursPayload = configuredHours !== undefined ? configuredHours : this.configuredHours;
      const branchHoursPayload = branchConfiguredHours !== undefined ? branchConfiguredHours : this.branchConfiguredHours;
      const bookingWindowDaysPayload = bookingWindowDays !== undefined ? bookingWindowDays : this.bookingWindowDays;

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/settings`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
          body: { 
            smsGatewayKey, 
            smsSenderName, 
            configuredHours: hoursPayload,
            branchConfiguredHours: branchHoursPayload,
            bookingWindowDays: bookingWindowDaysPayload
          },
        });

        if (response && response.success) {
          this.smsGatewayKey = smsGatewayKey;
          this.smsSenderName = smsSenderName;
          this.configuredHours = hoursPayload;
          this.branchConfiguredHours = branchHoursPayload;
          this.bookingWindowDays = bookingWindowDaysPayload;
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_sms_gateway_key", smsGatewayKey);
            window.localStorage.setItem("splendor_sms_sender_name", smsSenderName);
            window.localStorage.setItem("splendor_configured_hours", JSON.stringify(hoursPayload));
            window.localStorage.setItem("splendor_branch_configured_hours", JSON.stringify(branchHoursPayload));
            window.localStorage.setItem("splendor_booking_window_days", String(bookingWindowDaysPayload));
          }
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "პარამეტრების განახლება ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("Failed to update settings via API. Simulating local offline update.", err);
      }

      // Offline simulation fallback
      this.smsGatewayKey = smsGatewayKey;
      this.smsSenderName = smsSenderName;
      this.configuredHours = hoursPayload;
      this.branchConfiguredHours = branchHoursPayload;
      this.bookingWindowDays = bookingWindowDaysPayload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("splendor_sms_gateway_key", smsGatewayKey);
        window.localStorage.setItem("splendor_sms_sender_name", smsSenderName);
        window.localStorage.setItem("splendor_configured_hours", JSON.stringify(hoursPayload));
        window.localStorage.setItem("splendor_branch_configured_hours", JSON.stringify(branchHoursPayload));
        window.localStorage.setItem("splendor_booking_window_days", String(bookingWindowDaysPayload));
      }
      this.loading = false;
      return { success: true };
    },

    async fetchCalendarOverrides() {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/settings/calendar-overrides`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        if (response && response.success) {
          this.calendarOverrides = response.overrides || {};
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_calendar_overrides", JSON.stringify(this.calendarOverrides));
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch calendar overrides from API. Falling back to local copy.", err);
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("splendor_calendar_overrides");
          if (stored) {
            this.calendarOverrides = JSON.parse(stored);
          }
        }
      } finally {
        this.loading = false;
      }
    },

    async toggleCalendarOverride(dateStr: string, status: "working" | "non_working") {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/settings/calendar-overrides`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
          body: { dateStr, status },
        });

        if (response && response.success) {
          this.calendarOverrides[dateStr] = status;
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_calendar_overrides", JSON.stringify(this.calendarOverrides));
          }
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "კალენდრის შეცვლა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("Failed to update calendar overrides via API. Simulating local update.", err);
      }

      // Offline simulation fallback
      this.calendarOverrides[dateStr] = status;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("splendor_calendar_overrides", JSON.stringify(this.calendarOverrides));
      }
      this.loading = false;
      return { success: true };
    },

    async fetchPublicCalendarOverrides() {
      const config = useRuntimeConfig();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/settings/calendar-overrides`);
        if (response && response.success) {
          this.calendarOverrides = response.overrides || {};
          this.bookingWindowDays = response.bookingWindowDays || 0;
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_calendar_overrides", JSON.stringify(this.calendarOverrides));
            window.localStorage.setItem("splendor_booking_window_days", String(this.bookingWindowDays));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch public calendar overrides:", err);
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("splendor_calendar_overrides");
          if (stored) {
            this.calendarOverrides = JSON.parse(stored);
          }
          const storedDays = window.localStorage.getItem("splendor_booking_window_days");
          if (storedDays) {
            this.bookingWindowDays = Number(storedDays);
          }
        }
      }
    },
  },
});
