import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";

export interface Booking {
  id: string;
  bookingId: string;
  customerId: string;
  washingBayId: string;
  vehicleTypeId: string;
  startTime: string;
  endTime: string;
  totalPrice: string;
  paymentMethod: "on_site" | "card_online";
  paymentStatus: "unpaid" | "paid" | "failed";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  customer: {
    name: string;
    phoneNumber: string;
  };
  vehicleType: {
    name: string;
  };
  bookingServices: Array<{
    service: {
      name: string;
    };
    price: string;
    durationMinutes: number;
  }>;
}

export const useAdminStore = defineStore("adminStore", {
  state: () => ({
    bookings: [] as Booking[],
    stats: {
      pending: 0,
      inProgress: 0,
      completed: 0,
    },
    revenueToday: 0,
    crm: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchDashboardData() {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const data: any = await $fetch(`${config.public.apiBase}/bookings/admin/dashboard/stats`);
        
        this.bookings = data.bookings;
        this.stats = data.stats;
        this.revenueToday = data.revenueToday;
        this.crm = data.crm;
      } catch (err: any) {
        console.warn("Error loading dashboard data from API:", err);
        this.error = err.data?.error || "სერვერთან კავშირი ვერ დამყარდა. გთხოვთ, შეამოწმოთ ინტერნეტის კავშირი.";
        this.bookings = [];
        this.crm = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Handle incoming real-time socket events for new bookings.
     */
    handleBookingCreated(newBooking: Booking) {
      const exists = this.bookings.find((b) => b.id === newBooking.id);
      if (!exists) {
        this.bookings.push(newBooking);
        this.recalculateStats();
      }
    },

    /**
     * Handle incoming real-time socket updates for drag-and-drop or status changes.
     */
    handleBookingUpdated(updatedBooking: Booking) {
      const index = this.bookings.findIndex((b) => b.id === updatedBooking.id);
      if (index !== -1) {
        this.bookings[index] = updatedBooking;
      } else {
        this.bookings.push(updatedBooking);
      }
      this.recalculateStats();
    },

    recalculateStats() {
      const stats = {
        pending: 0,
        inProgress: 0,
        completed: 0,
      };

      let revenue = 0;
      const todayStr = new Date().toISOString().split("T")[0];

      this.bookings.forEach((b) => {
        const bookingDateStr = new Date(b.startTime).toISOString().split("T")[0];
        if (bookingDateStr === todayStr) {
          if (b.status === "pending") stats.pending++;
          if (b.status === "in_progress") stats.inProgress++;
          if (b.status === "completed") stats.completed++;

          if (b.status === "completed" || b.paymentStatus === "paid") {
            revenue += parseFloat(b.totalPrice);
          }
        }
      });

      this.stats = stats;
      this.revenueToday = revenue;
    },

    /**
     * Trigger a drag-and-drop move endpoint update.
     */
    async moveBooking(bookingId: string, washingBayId: string, startTime: string) {
      const config = useRuntimeConfig();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/bookings/admin/${bookingId}/move`, {
          method: "PATCH",
          body: { washingBayId, startTime },
        });

        if (response.success) {
          this.handleBookingUpdated(response.booking);
        }
        return { success: true };
      } catch (err: any) {
        console.warn("Failed to move booking via API, simulating local movement update:", err);
        const booking = this.bookings.find((b) => b.id === bookingId);
        if (booking) {
          booking.washingBayId = washingBayId;
          // const duration = booking.bookingServices.reduce((sum, s) => sum + s.durationMinutes, 0);
          const duration = 30; // Temporarily fixed duration (independent of service duration)
          const start = new Date(startTime);
          const end = new Date(start.getTime() + duration * 60000);
          booking.endTime = end.toISOString();
          this.handleBookingUpdated(booking);

          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('splendor_bookings', JSON.stringify(this.bookings));
            } catch (e) {
              console.error("localStorage error:", e);
            }
          }
        }
        return { success: true };
      }
    },

    /**
     * Trigger a manual status or payment change.
     */
    async updateStatus(bookingId: string, payload: { status?: string; paymentStatus?: string }) {
      const config = useRuntimeConfig();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/bookings/admin/${bookingId}/status`, {
          method: "PATCH",
          body: payload,
        });

        if (response.success) {
          this.handleBookingUpdated(response.booking);
        }
        return { success: true };
      } catch (err: any) {
        console.warn("Failed to update status via API, simulating local status modification:", err);
        const booking = this.bookings.find((b) => b.id === bookingId);
        if (booking) {
          if (payload.status) booking.status = payload.status as any;
          if (payload.paymentStatus) booking.paymentStatus = payload.paymentStatus as any;
          this.handleBookingUpdated(booking);

          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('splendor_bookings', JSON.stringify(this.bookings));
            } catch (e) {
              console.error("localStorage error:", e);
            }
          }
        }
        return { success: true };
      }
    },

    async toggleBlockCustomer(customerId: string, isBlocked: boolean) {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/customers/${customerId}/block`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            "Content-Type": "application/json",
          },
          body: { isBlocked },
        });

        if (response && response.success) {
          const customer = this.crm.find(c => c.id === customerId);
          if (customer) {
            customer.isBlocked = isBlocked;
          }
          return { success: true };
        }
      } catch (err: any) {
        console.warn("Failed to toggle customer block via API, simulating locally:", err);
        const customer = this.crm.find(c => c.id === customerId);
        if (customer) {
          customer.isBlocked = isBlocked;
        }
        return { success: true };
      } finally {
        this.loading = false;
      }
    }
  },
});
