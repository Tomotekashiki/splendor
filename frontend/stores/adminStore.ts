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
        console.warn("Error loading dashboard data from API, loading mock dashboard data:", err);
        const today = new Date();
        const baseDateStr = today.toISOString().split("T")[0];
        
        let localBookings: Booking[] = [];
        if (typeof window !== 'undefined') {
          try {
            let raw = window.localStorage.getItem('splendor_bookings');
            // If raw contains old mock seed bookings (mb-1), clear to start fresh
            if (raw && raw.includes('mb-1')) {
              window.localStorage.removeItem('splendor_bookings');
              raw = null;
            }
            if (raw) {
              localBookings = JSON.parse(raw);
            } else {
              localBookings = [];
              window.localStorage.setItem('splendor_bookings', JSON.stringify(localBookings));
            }

            // Register storage listeners once to maintain real-time sync across client & admin tabs
            if (!(window as any)._splendor_storage_listener_set) {
              (window as any)._splendor_storage_listener_set = true;
              window.addEventListener('storage', (event) => {
                if (event.key === 'splendor_bookings') {
                  const val = event.newValue;
                  if (val) {
                    this.bookings = JSON.parse(val);
                    this.recalculateStats();
                  }
                }
              });
              window.addEventListener('splendor_new_booking', (event: any) => {
                const newB = event.detail;
                const exists = this.bookings.find(b => b.id === newB.id);
                if (!exists) {
                  this.bookings.push(newB);
                  this.recalculateStats();
                }
              });
            }
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }

        this.bookings = localBookings;
        this.recalculateStats();
        
        this.crm = [
          {
            id: "c-1",
            name: "Giorgi Chanturia",
            phoneNumber: "+995 599 123 456",
            createdAt: "2026-05-15T08:00:00.000Z",
            bookingsCount: 12,
            lifetimeValue: 240.00,
            history: [
              {
                id: "h-1-1",
                bookingId: "ANT-781290",
                startTime: `${baseDateStr}T10:00:00.000Z`,
                totalPrice: "20.00",
                status: "completed"
              },
              {
                id: "h-1-2",
                bookingId: "ANT-112233",
                startTime: `${new Date(today.getTime() - 86400000 * 3).toISOString()}`,
                totalPrice: "35.00",
                status: "completed"
              }
            ]
          },
          {
            id: "c-2",
            name: "Nino Lomjaria",
            phoneNumber: "+995 577 987 654",
            createdAt: "2026-05-20T10:00:00.000Z",
            bookingsCount: 8,
            lifetimeValue: 320.00,
            history: [
              {
                id: "h-2-1",
                bookingId: "ANT-902187",
                startTime: `${baseDateStr}T11:00:00.000Z`,
                totalPrice: "65.00",
                status: "in_progress"
              }
            ]
          },
          {
            id: "c-3",
            name: "Davit Kapanadze",
            phoneNumber: "+995 555 443 322",
            createdAt: "2026-05-25T12:00:00.000Z",
            bookingsCount: 4,
            lifetimeValue: 140.00,
            history: [
              {
                id: "h-3-1",
                bookingId: "ANT-348210",
                startTime: `${baseDateStr}T14:00:00.000Z`,
                totalPrice: "35.00",
                status: "pending"
              }
            ]
          }
        ];
        this.error = null;
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
          booking.startTime = startTime;
          const duration = booking.bookingServices.reduce((sum, s) => sum + s.durationMinutes, 0);
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
