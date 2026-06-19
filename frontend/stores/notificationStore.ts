import { defineStore } from "pinia";
import { ref as dbRef, onChildAdded, onChildChanged, get as dbGet } from "firebase/database";
import { useNuxtApp } from "#app";
import { useLocaleStore } from "./localeStore";
import { useBookingStore } from "./bookingStore";
import { useAdminStore } from "./adminStore";
import { useAuthStore } from "./authStore";

export interface AppNotification {
  id: string;
  type: "create" | "update";
  title: string;
  body: string;
  bookingId: string;
  createdAt: string;
  isRead: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  body: string;
  bookingId?: string;
}

export const useNotificationStore = defineStore("notificationStore", {
  state: () => ({
    notifications: [] as AppNotification[],
    activeToasts: [] as ToastMessage[],
    isListening: false,
    permissionStatus: "default" as NotificationPermission,
    initTime: 0,
    pollingInterval: null as any,
  }),

  actions: {
    initializeStore() {
      if (typeof window !== "undefined") {
        this.initTime = Date.now();
        
        // Load notification history
        try {
          const stored = window.localStorage.getItem("splendor_notifications");
          if (stored) {
            this.notifications = JSON.parse(stored);
          }
        } catch (e) {
          console.error("Failed to load notifications from localStorage:", e);
        }

        // Check current notification permission
        if ("Notification" in window) {
          this.permissionStatus = Notification.permission;
        }
      }
    },

    async requestDesktopPermission() {
      if (typeof window !== "undefined" && "Notification" in window) {
        try {
          const permission = await Notification.requestPermission();
          this.permissionStatus = permission;
          if (permission === "granted") {
            await this.registerFCMToken();
          }
          return permission;
        } catch (e) {
          console.error("Failed to request notification permission:", e);
        }
      }
      return "denied" as NotificationPermission;
    },

    async initListener() {
      if (this.isListening) return;
      
      const { $socket } = useNuxtApp();
      if (!$socket) {
        console.warn("Socket.io instance ($socket) not found. Cannot start notifications listener.");
        return;
      }

      this.initializeStore();
      this.isListening = true;
      console.log("🔔 Listening to real-time booking notifications via WebSockets");

      // Handle new bookings
      $socket.on("booking_created", (booking: any) => {
        if (!booking) return;
        console.log("🆕 New booking received via WebSocket:", booking);
        this.handleNewBookingNotification(booking);
        
        // Also feed to the existing adminStore bookings list so it displays instantly on the dashboard/calendar/orders page
        const adminStore = useAdminStore();
        adminStore.handleBookingCreated(booking);
      });

      // Handle booking modifications (drag and drop, status updates, cancellation)
      $socket.on("booking_updated", (booking: any) => {
        if (!booking) return;
        console.log("🔄 Booking modified received via WebSocket:", booking);
        this.handleUpdatedBookingNotification(booking);
        
        // Update local adminStore list
        const adminStore = useAdminStore();
        adminStore.handleBookingUpdated(booking);
      });

      // Start polling fallback for production/serverless hosting
      this.startPolling();

      // Register FCM if permission is already granted
      if (this.permissionStatus === "granted") {
        this.registerFCMToken();
      }
    },

    /**
     * Fetch related information to build a populated booking object
     */
    async populateBookingData(booking: any) {
      const { $db } = useNuxtApp();
      const bookingStore = useBookingStore();

      // Ensure booking metadata is loaded (branches, services, vehicleTypes)
      if (bookingStore.branches.length === 0) {
        await bookingStore.loadServiceGrid();
      }

      let customer = { name: "კლიენტი", phoneNumber: "" };
      if (booking.customerId) {
        try {
          const custSnap = await dbGet(dbRef($db, `customers/${booking.customerId}`));
          if (custSnap.exists()) {
            const val = custSnap.val();
            customer = {
              name: val.name || val.username || "კლიენტი",
              phoneNumber: val.phoneNumber || val.phone || "",
            };
          }
        } catch (e) {
          console.warn("Failed to load customer details for notification:", e);
        }
      }

      // Fallback customer details from booking root if available
      if (booking.customer) {
        customer.name = booking.customer.name || customer.name;
        customer.phoneNumber = booking.customer.phoneNumber || customer.phoneNumber;
      }

      // Resolve branch
      const branch = bookingStore.branches.find((b: any) => b.id === booking.branchId) || 
                     { name: { ka: "ფილიალი", en: "Branch" } };

      // Resolve vehicle type
      const vehicleType = bookingStore.vehicleTypes.find((v: any) => v.id === booking.vehicleTypeId) || 
                          { name: "ავტომობილი" };

      // Resolve services
      const bookingServices = (booking.services || []).map((bs: any) => {
        const service = bookingStore.services.find((s: any) => s.id === bs.serviceId);
        return {
          ...bs,
          service: service || { title: { ka: "სერვისი", en: "Service" } }
        };
      });

      return {
        ...booking,
        customer,
        branch,
        vehicleType,
        bookingServices,
      };
    },

    handleNewBookingNotification(booking: any) {
      const localeStore = useLocaleStore();
      
      const branchName = localeStore.t(booking.branch?.name || "ფილიალი");
      const customerName = booking.customer?.name || "კლიენტი";
      const totalPriceFormatted = localeStore.formatPrice(booking.totalPrice);
      
      const title = localeStore.t("new_booking_notification");
      const body = `${customerName} - ${branchName} - ${totalPriceFormatted}`;

      // 1. Play Sound Chime
      this.playChimeSound();

      // 2. Trigger System Notification (if backgrounded / permitted)
      this.triggerDesktopNotification(title, body, "/admin/orders");

      // 3. Add to UI Toast
      this.addToast("success", title, body, booking.id);

      // 4. Add to Store History
      this.addNotificationToHistory("create", title, body, booking.id);
    },

    handleUpdatedBookingNotification(booking: any) {
      const localeStore = useLocaleStore();
      
      const branchName = localeStore.t(booking.branch?.name || "ფილიალი");
      const customerName = booking.customer?.name || "კლიენტი";
      const statusWord = booking.status === "cancelled" ? "გაუქმდა / Cancelled" : "განახლდა / Updated";
      
      const title = `${localeStore.t("booking_updated_notification")} (${booking.bookingId})`;
      const body = `${customerName} - ${branchName} (${statusWord})`;

      // 1. Play sound chime (slightly shorter/different tone for updates)
      this.playChimeSound(true);

      // 2. Trigger System Notification
      this.triggerDesktopNotification(title, body, "/admin/orders");

      // 3. Add to UI Toast
      this.addToast("info", title, body, booking.id);

      // 4. Add to Store History
      this.addNotificationToHistory("update", title, body, booking.id);
    },

    addToast(type: "success" | "info" | "warning", title: string, body: string, bookingId?: string) {
      const id = "toast-" + Math.random().toString(36).substring(2, 9);
      this.activeToasts.push({ id, type, title, body, bookingId });

      // Automatically clear after 7 seconds
      setTimeout(() => {
        this.clearToast(id);
      }, 7000);
    },

    clearToast(id: string) {
      this.activeToasts = this.activeToasts.filter(t => t.id !== id);
    },

    addNotificationToHistory(type: "create" | "update", title: string, body: string, bookingId: string) {
      const newNotif: AppNotification = {
        id: "notif-" + Math.random().toString(36).substring(2, 9),
        type,
        title,
        body,
        bookingId,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      this.notifications.unshift(newNotif);
      
      // Cap history at 50 entries
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50);
      }

      this.saveHistory();
    },

    markAllAsRead() {
      this.notifications.forEach(n => n.isRead = true);
      this.saveHistory();
    },

    clearAllNotifications() {
      this.notifications = [];
      this.saveHistory();
    },

    saveHistory() {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("splendor_notifications", JSON.stringify(this.notifications));
        } catch (e) {
          console.error("Failed to save notifications to localStorage:", e);
        }
      }
    },

    /**
     * Synthesizes a high-quality notification chime using Web Audio API (zero external assets needed).
     */
    playChimeSound(isUpdate = false) {
      if (typeof window === "undefined") return;

      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();

        if (isUpdate) {
          // Single neat tone for updates
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        } else {
          // Pleasant dual-tone chime (E5 -> A5) for new bookings
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          gain1.gain.setValueAtTime(0.12, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
          
          osc1.connect(gain1);
          gain1.connect(ctx.destination);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
          gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
          gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.52);
          
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.4);
          osc2.start(ctx.currentTime + 0.12);
          osc2.stop(ctx.currentTime + 0.52);
        }
      } catch (err) {
        console.warn("Failed to play synthesized audio chime:", err);
      }
    },

    triggerDesktopNotification(title: string, body: string, path: string) {
      if (typeof window === "undefined" || !("Notification" in window)) return;

      if (Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
          });
          
          notification.onclick = () => {
            window.focus();
            const router = useNuxtApp().$router;
            if (router) {
              router.push(path);
            }
          };
        } catch (e) {
          console.error("Failed to trigger desktop notification:", e);
        }
      }
    },

    startPolling() {
      if (this.pollingInterval) return;
      
      // Initial poll to load existing state if needed
      this.pollBookings();

      this.pollingInterval = setInterval(async () => {
        const { $socket } = useNuxtApp();
        const socketConnected = $socket && $socket.connected;
        
        // Only run polling query if websocket is disconnected (which is the case on Vercel)
        if (!socketConnected) {
          console.log("📡 WebSocket disconnected. Polling bookings fallback...");
          await this.pollBookings();
        }
      }, 12000); // Check every 12 seconds
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    async pollBookings() {
      const config = useRuntimeConfig();
      const adminStore = useAdminStore();
      
      try {
        const data: any = await $fetch(`${config.public.apiBase}/bookings/admin/dashboard/stats`);
        const latestBookings = data.bookings || [];
        
        if (latestBookings.length === 0) return;

        // If the current adminStore bookings list is completely empty, it means this is the first load.
        // We initialize the list without triggering notification spam for old bookings.
        const isInitialLoad = adminStore.bookings.length === 0;
        
        if (isInitialLoad) {
          adminStore.bookings = latestBookings;
          adminStore.recalculateStats();
          return;
        }

        // Compare the fetched list with the local list to identify new or updated bookings
        for (const booking of latestBookings) {
          const existing = adminStore.bookings.find((b: any) => b.id === booking.id);
          
          if (!existing) {
            // Found a new booking created on production!
            console.log("🆕 Polled new booking:", booking);
            this.handleNewBookingNotification(booking);
            adminStore.handleBookingCreated(booking);
          } else {
            // Check if status, payment status, bay, or time changed
            const statusChanged = existing.status !== booking.status;
            const paymentStatusChanged = existing.paymentStatus !== booking.paymentStatus;
            const timeChanged = existing.startTime !== booking.startTime;
            const bayChanged = existing.washingBayId !== booking.washingBayId;

            if (statusChanged || paymentStatusChanged || timeChanged || bayChanged) {
              console.log("🔄 Polled updated booking:", booking);
              this.handleUpdatedBookingNotification(booking);
              adminStore.handleBookingUpdated(booking);
            }
          }
        }
      } catch (err) {
        console.warn("Polling fallback fetch failed:", err);
      }
    },

    async registerFCMToken() {
      if (typeof window === "undefined") return;
      
      const authStore = useAuthStore();
      if (!authStore.user) {
        console.log("No authenticated user, skipping FCM registration.");
        return;
      }

      try {
        const { getApp, getApps } = await import("firebase/app");
        const app = getApps().length > 0 ? getApp() : undefined;
        if (!app) {
          console.warn("Firebase app not found. Skipping FCM token retrieval.");
          return;
        }

        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
        const messaging = getMessaging(app);

        // Fetch token using the Public VAPID Key
        const token = await getToken(messaging, {
          vapidKey: "BGaN6RUfbDdOTwMrgNLVwwD_XIOhIz7qBZFZk7_cXSPaV1rIH5Uq7aLqaaCeT6PJUQopMnHl-QPzBFzvHjv3Eb4"
        });

        if (token) {
          console.log("🔑 Retrieved FCM Token:", token);
          
          // Save token to Realtime Database at /admin_fcm_tokens/${userId}
          const { $db } = useNuxtApp();
          if ($db) {
            const { ref, set } = await import("firebase/database");
            await set(ref($db, `admin_fcm_tokens/${authStore.user.id}`), token);
            console.log(`✅ FCM token registered in Firebase DB for user ${authStore.user.id}`);
          }
        } else {
          console.log("No registration token available. Request permission to generate one.");
        }

        // Listen for foreground push notifications (when the app is active)
        onMessage(messaging, (payload: any) => {
          console.log("✉️ Foreground message received:", payload);
          
          const title = payload.notification?.title || "შეტყობინება";
          const body = payload.notification?.body || "";
          
          // Add to toasts list to display on screen
          this.addToast("success", title, body);
        });

      } catch (err) {
        console.warn("⚠️ FCM Token registration failed:", err);
      }
    },

    async removeFCMToken() {
      const authStore = useAuthStore();
      if (!authStore.user) return;

      const { $db } = useNuxtApp();
      if ($db) {
        try {
          const { ref, remove } = await import("firebase/database");
          await remove(ref($db, `admin_fcm_tokens/${authStore.user.id}`));
          console.log(`🗑️ FCM token removed from Firebase DB for user ${authStore.user.id}`);
        } catch (e) {
          console.error("Failed to delete FCM token on logout:", e);
        }
      }
    }
  }
});
