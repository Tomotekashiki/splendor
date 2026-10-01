import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";
import { useBookingStore } from "./bookingStore";

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
        const authStore = useAuthStore();
        const data: any = await $fetch(`${config.public.apiBase}/bookings/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        
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
      const authStore = useAuthStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/bookings/admin/${bookingId}/move`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
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
      const authStore = useAuthStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/bookings/admin/${bookingId}/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
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
    },

    async createService(payload: { title: { ka: string; en: string; [key: string]: string }; description: { ka: string | null; en: string | null; [key: string]: string | null } | null; isAddon: boolean; matrix: Array<{ vehicleTypeId: string; price: string; durationMinutes: number }> }) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/services`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: payload,
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          let errMsg = err.data?.error || "მომსახურების შექმნა ვერ მოხერხდა.";
          if (err.data?.details && Array.isArray(err.data.details)) {
            const fieldErrors = err.data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
            errMsg += ` (${fieldErrors})`;
          }
          return { success: false, error: errMsg };
        }
        console.warn("Failed to create service via API, simulating local creation:", err);
        const newServiceId = "s-" + Math.random().toString(36).substring(2, 9);
        const newService = {
          id: newServiceId,
          title: payload.title,
          description: payload.description,
          isAddon: payload.isAddon,
        };

        const newMatrixEntries = payload.matrix.map(m => ({
          vehicleTypeId: m.vehicleTypeId,
          serviceId: newServiceId,
          price: parseFloat(m.price).toFixed(2),
          durationMinutes: m.durationMinutes
        }));

        bookingStore.services.push(newService);
        bookingStore.serviceMatrix.push(...newMatrixEntries);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_services", JSON.stringify(bookingStore.services));
            window.localStorage.setItem("splendor_service_matrix", JSON.stringify(bookingStore.serviceMatrix));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async reorderServices(serviceIds: string[]) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/services/reorder`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: { serviceIds },
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          return { success: false, error: err.data?.error || "სერვისების სორტირება ვერ მოხერხდა." };
        }
        console.warn("Failed to reorder services via API, simulating local reordering:", err);
        
        serviceIds.forEach((id, idx) => {
          const service = bookingStore.services.find(s => s.id === id);
          if (service) {
            service.displayOrder = idx + 1;
          }
        });

        bookingStore.services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_services", JSON.stringify(bookingStore.services));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async updateService(serviceId: string, payload: { title: { ka: string; en: string; [key: string]: string }; description: { ka: string | null; en: string | null; [key: string]: string | null } | null; isAddon: boolean; matrix: Array<{ vehicleTypeId: string; price: string; durationMinutes: number }> }) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/services/${serviceId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: payload,
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          let errMsg = err.data?.error || "მომსახურების განახლება ვერ მოხერხდა.";
          if (err.data?.details && Array.isArray(err.data.details)) {
            const fieldErrors = err.data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
            errMsg += ` (${fieldErrors})`;
          }
          return { success: false, error: errMsg };
        }
        console.warn("Failed to update service via API, simulating local update:", err);
        
        const idx = bookingStore.services.findIndex(s => s.id === serviceId);
        if (idx !== -1) {
          bookingStore.services[idx] = {
            id: serviceId,
            title: payload.title,
            description: payload.description,
            isAddon: payload.isAddon
          };
        }

        bookingStore.serviceMatrix = bookingStore.serviceMatrix.filter(m => m.serviceId !== serviceId);

        const newMatrixEntries = payload.matrix.map(m => ({
          vehicleTypeId: m.vehicleTypeId,
          serviceId: serviceId,
          price: parseFloat(m.price).toFixed(2),
          durationMinutes: m.durationMinutes
        }));

        bookingStore.serviceMatrix.push(...newMatrixEntries);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_services", JSON.stringify(bookingStore.services));
            window.localStorage.setItem("splendor_service_matrix", JSON.stringify(bookingStore.serviceMatrix));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async deleteService(serviceId: string) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/services/${serviceId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          return { success: false, error: err.data?.error || "მომსახურების წაშლა ვერ მოხერხდა." };
        }
        console.warn("Failed to delete service via API, simulating local deletion:", err);

        if (typeof window !== "undefined") {
          try {
            const rawBookings = window.localStorage.getItem("splendor_bookings");
            const bookingsList = rawBookings ? JSON.parse(rawBookings) : [];
            const isUsed = bookingsList.some((b: any) => 
              b.bookingServices?.some((bs: any) => bs.serviceId === serviceId)
            );

            if (isUsed) {
              return {
                success: false,
                error: "Cannot delete this service because it is currently linked to historical wash reservations."
              };
            }
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }

        bookingStore.services = bookingStore.services.filter(s => s.id !== serviceId);
        bookingStore.serviceMatrix = bookingStore.serviceMatrix.filter(m => m.serviceId !== serviceId);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_services", JSON.stringify(bookingStore.services));
            window.localStorage.setItem("splendor_service_matrix", JSON.stringify(bookingStore.serviceMatrix));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async createBranch(payload: { name: { ka: string; en: string; [key: string]: string }; address: { ka: string | null; en: string | null; [key: string]: string | null } | null; isActive: boolean; washingBaysCount?: number }) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/branches`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: payload,
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          let errMsg = err.data?.error || "ფილიალის შექმნა ვერ მოხერხდა.";
          if (err.data?.details && Array.isArray(err.data.details)) {
            const fieldErrors = err.data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
            errMsg += ` (${fieldErrors})`;
          }
          return { success: false, error: errMsg };
        }
        console.warn("Failed to create branch via API, simulating local creation:", err);
        const newBranchId = "br-" + Math.random().toString(36).substring(2, 9);
        const newBranch = {
          id: newBranchId,
          name: payload.name,
          address: payload.address,
          isActive: payload.isActive,
        };

        bookingStore.branches.push(newBranch);

        const baysCount = payload.washingBaysCount || 1;
        for (let i = 1; i <= baysCount; i++) {
          const newBay = {
            id: "b-mock-" + Math.random().toString(36).substring(2, 9),
            name: `ბოქსი ${i}`,
            isActive: true,
            branchId: newBranchId,
          };
          bookingStore.washingBays.push(newBay);
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_branches", JSON.stringify(bookingStore.branches));
            window.localStorage.setItem("splendor_washing_bays", JSON.stringify(bookingStore.washingBays));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async reorderBranches(branchIds: string[]) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/branches/reorder`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: { branchIds },
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          return { success: false, error: err.data?.error || "ფილიალების სორტირება ვერ მოხერხდა." };
        }
        console.warn("Failed to reorder branches via API, simulating local reordering:", err);
        
        branchIds.forEach((id, idx) => {
          const branch = bookingStore.branches.find(b => b.id === id);
          if (branch) {
            branch.displayOrder = idx + 1;
          }
        });

        bookingStore.branches.sort((a, b) => {
          const orderA = a.displayOrder ?? 0;
          const orderB = b.displayOrder ?? 0;
          if (orderA !== orderB) return orderA - orderB;

          const nameA = typeof a.name === 'string' ? a.name : (a.name?.ka || a.name?.en || '');
          const nameB = typeof b.name === 'string' ? b.name : (b.name?.ka || b.name?.en || '');
          return nameA.localeCompare(nameB);
        });

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_branches", JSON.stringify(bookingStore.branches));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async updateBranch(branchId: string, payload: { name: { ka: string; en: string; [key: string]: string }; address: { ka: string | null; en: string | null; [key: string]: string | null } | null; isActive: boolean; washingBaysCount?: number }) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/branches/${branchId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: payload,
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          let errMsg = err.data?.error || "ფილიალის განახლება ვერ მოხერხდა.";
          if (err.data?.details && Array.isArray(err.data.details)) {
            const fieldErrors = err.data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
            errMsg += ` (${fieldErrors})`;
          }
          return { success: false, error: errMsg };
        }
        console.warn("Failed to update branch via API, simulating local update:", err);
        
        const idx = bookingStore.branches.findIndex(b => b.id === branchId);
        if (idx !== -1) {
          bookingStore.branches[idx] = {
            id: branchId,
            name: payload.name,
            address: payload.address,
            isActive: payload.isActive
          };
        }

        if (payload.washingBaysCount !== undefined) {
          const branchBays = bookingStore.washingBays.filter(b => b.branchId === branchId);
          branchBays.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          if (branchBays.length < payload.washingBaysCount) {
            const diff = payload.washingBaysCount - branchBays.length;
            for (let i = 1; i <= diff; i++) {
              const nextNum = branchBays.length + i;
              const newBay = {
                id: "b-mock-" + Math.random().toString(36).substring(2, 9),
                name: `ბოქსი ${nextNum}`,
                isActive: true,
                branchId: branchId,
              };
              bookingStore.washingBays.push(newBay);
            }
          } else if (branchBays.length > payload.washingBaysCount) {
            const diff = branchBays.length - payload.washingBaysCount;
            const baysToRemove = branchBays.slice(-diff);
            const removeIds = baysToRemove.map(b => b.id);
            bookingStore.washingBays = bookingStore.washingBays.filter(b => !removeIds.includes(b.id));
          }
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_branches", JSON.stringify(bookingStore.branches));
            window.localStorage.setItem("splendor_washing_bays", JSON.stringify(bookingStore.washingBays));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    },

    async deleteBranch(branchId: string) {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();
      const bookingStore = useBookingStore();
      try {
        const response: any = await $fetch(`${config.public.apiBase}/branches/${branchId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        if (response.success) {
          await bookingStore.loadServiceGrid();
        }
        return { success: true };
      } catch (err: any) {
        if (err.status) {
          return { success: false, error: err.data?.error || "ფილიალის წაშლა ვერ მოხერხდა." };
        }
        console.warn("Failed to delete branch via API, simulating local deletion:", err);

        if (typeof window !== "undefined") {
          try {
            const rawBookings = window.localStorage.getItem("splendor_bookings");
            const bookingsList = rawBookings ? JSON.parse(rawBookings) : [];
            
            const branchBays = bookingStore.washingBays.filter(b => b.branchId === branchId);
            const branchBayIds = branchBays.map(b => b.id);

            const isUsed = bookingsList.some((b: any) => 
              b.branchId === branchId || 
              b.branch?.id === branchId || 
              b.branch === branchId ||
              branchBayIds.includes(b.washingBayId)
            );

            if (isUsed) {
              return {
                success: false,
                error: "Cannot delete this branch because it is currently linked to bookings. Delete or reschedule the bookings first."
              };
            }
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }

        bookingStore.branches = bookingStore.branches.filter(b => b.id !== branchId);
        bookingStore.washingBays = bookingStore.washingBays.filter(b => b.branchId !== branchId);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("splendor_branches", JSON.stringify(bookingStore.branches));
            window.localStorage.setItem("splendor_washing_bays", JSON.stringify(bookingStore.washingBays));
          } catch (e) {
            console.error("localStorage error:", e);
          }
        }
        return { success: true };
      }
    }
  },
});
