import { defineStore } from "pinia";

export const useCustomerAuthStore = defineStore("customerAuthStore", {
  state: () => ({
    token: null as string | null,
    customer: null as {
      id: string;
      name: string;
      phoneNumber: string;
    } | null,
    loading: false,
    error: null as string | null,
    
    // local mockup state for offline mode
    localUsers: [] as any[],
    customerBookings: [] as any[],
  }),

  getters: {
    isAuthenticated(state) {
      return !!state.token;
    },
  },

  actions: {
    initialize() {
      if (typeof window !== "undefined") {
        try {
          const session = window.localStorage.getItem("splendor_customer_session");
          if (session) {
            const parsed = JSON.parse(session);
            let isExpired = false;
            try {
              const token = parsed.token;
              if (token && !token.startsWith("mock-session-")) {
                const parts = token.split(".");
                if (parts.length === 3) {
                  const base64Url = parts[1];
                  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                  const payload = JSON.parse(window.atob(base64));
                  if (payload.exp && payload.exp < Date.now()) {
                    isExpired = true;
                  }
                }
              }
            } catch (e) {
              console.error("Error decoding customer token for expiration check:", e);
            }

            if (isExpired) {
              console.warn("Stored customer token is expired. Clearing session.");
              this.token = null;
              this.customer = null;
              window.localStorage.removeItem("splendor_customer_session");
            } else {
              this.token = parsed.token;
              this.customer = parsed.customer;
            }
          }
          
          const storedBookings = window.localStorage.getItem("splendor_customer_bookings");
          this.customerBookings = storedBookings ? JSON.parse(storedBookings) : [];
          
          const storedLocal = window.localStorage.getItem("splendor_customer_users");
          this.localUsers = storedLocal ? JSON.parse(storedLocal) : [
            {
              id: "cust-demo",
              name: "ნოდო დემო",
              password: "password",
              phoneNumber: "599123456",
            }
          ];
        } catch (e) {
          console.error("Failed to restore customer session:", e);
        }
      }
    },

    saveSession() {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            "splendor_customer_session",
            JSON.stringify({ token: this.token, customer: this.customer })
          );
        } catch (e) {
          console.error("Failed to save customer session:", e);
        }
      }
    },

    async register(payload: {
      name: string;
      passwordHash: string; // Plain password passed in
      phoneNumber: string;
      otpCode: string;
    }) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/customer/register`, {
          method: "POST",
          body: {
            name: payload.name,
            password: payload.passwordHash,
            phoneNumber: payload.phoneNumber,
            otpCode: payload.otpCode,
          },
        });

        if (response.success) {
          this.token = response.token;
          this.customer = response.customer;
          this.saveSession();
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "რეგისტრაცია ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API registration failed, falling back to local simulation:", err);
        
        // Offline Simulation
        const match = this.localUsers.find(u => u.phoneNumber === payload.phoneNumber);
        if (match) {
          this.error = "Phone number is already registered.";
          this.loading = false;
          return { success: false, error: this.error };
        }

        const newUser = {
          id: "cust-" + Math.random().toString(36).substring(2, 9),
          name: payload.name,
          password: payload.passwordHash,
          phoneNumber: payload.phoneNumber,
        };

        this.localUsers.push(newUser);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("splendor_customer_users", JSON.stringify(this.localUsers));
        }

        this.token = "mock-cust-token-" + newUser.id;
        this.customer = {
          id: newUser.id,
          name: newUser.name,
          phoneNumber: newUser.phoneNumber,
        };
        this.saveSession();
        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    async login(phoneNumber: string, passwordHash: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/customer/login`, {
          method: "POST",
          body: { phoneNumber, password: passwordHash },
        });

        if (response.success) {
          this.token = response.token;
          this.customer = response.customer;
          this.saveSession();
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "ავტორიზაცია ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API login failed, checking local fallbacks:", err);
        
        // Offline Simulation
        const match = this.localUsers.find(u => u.phoneNumber === phoneNumber && u.password === passwordHash);
        if (match) {
          this.token = "mock-cust-token-" + match.id;
          this.customer = {
            id: match.id,
            name: match.name,
            phoneNumber: match.phoneNumber,
          };
          this.saveSession();
          this.loading = false;
          return { success: true };
        } else {
          this.error = "ტელეფონის ნომერი ან პაროლი არასწორია.";
          this.loading = false;
          return { success: false, error: this.error };
        }
      } finally {
        this.loading = false;
      }
    },

    async sendOtp(phoneNumber: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/send-otp`, {
          method: "POST",
          body: { phoneNumber },
        });
        return response;
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "კოდის გაგზავნა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API sendOtp failed, falling back to local simulation:", err);
        alert("SMS MOCK: Your verification OTP is 1234");
        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    async verifyOtp(phoneNumber: string, otpCode: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/verify-otp`, {
          method: "POST",
          body: { phoneNumber, otpCode },
        });
        return response;
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "კოდის დადასტურება ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API verifyOtp failed, checking local fallbacks:", err);
        if (otpCode !== "1234") {
          this.error = "არასწორი ან ვადაგასული SMS კოდი.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    async forgotPassword(phoneNumber: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/customer/forgot-password`, {
          method: "POST",
          body: { phoneNumber },
        });
        return response;
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "კოდის გაგზავნა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API forgotPassword failed, checking local fallbacks:", err);
        
        // Offline Simulation
        const match = this.localUsers.find(u => u.phoneNumber === phoneNumber);
        if (!match) {
          this.error = "ამ ტელეფონის ნომრით მომხმარებელი ვერ მოიძებნა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        
        alert("SMS MOCK: Your verification OTP is 1234");
        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    async verifyRecoveryOtp(phoneNumber: string, otpCode: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/verify-otp`, {
          method: "POST",
          body: { phoneNumber, otpCode },
        });
        return response;
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "კოდის დადასტურება ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API verifyRecoveryOtp failed, checking local fallbacks:", err);
        
        // Offline Simulation
        if (otpCode !== "1234") {
          this.error = "არასწორი ან ვადაგასული SMS კოდი.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        
        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(phoneNumber: string, otpCode: string, newPasswordHash: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/customer/reset-password`, {
          method: "POST",
          body: { phoneNumber, otpCode, newPassword: newPasswordHash },
        });
        return response;
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "პაროლის შეცვლა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API resetPassword failed, checking local fallbacks:", err);
        
        // Offline Simulation
        if (otpCode !== "1234") {
          this.error = "არასწორი ან ვადაგასული SMS კოდი.";
          this.loading = false;
          return { success: false, error: this.error };
        }

        const matchIndex = this.localUsers.findIndex(u => u.phoneNumber === phoneNumber);
        if (matchIndex === -1) {
          this.error = "მომხმარებელი ვერ მოიძებნა.";
          this.loading = false;
          return { success: false, error: this.error };
        }

        this.localUsers[matchIndex].password = newPasswordHash;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("splendor_customer_users", JSON.stringify(this.localUsers));
        }

        this.loading = false;
        return { success: true };
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.customer = null;
      this.customerBookings = [];
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("splendor_customer_session");
        window.localStorage.removeItem("splendor_customer_bookings");
      }
    },

    async fetchMyBookings() {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/bookings/my-bookings`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        if (response.success) {
          this.customerBookings = response.bookings;
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_customer_bookings", JSON.stringify(this.customerBookings));
          }
        }
      } catch (err: any) {
        console.warn("API my-bookings failed, loading offline bookings:", err);
        
        const status = err.status || err.statusCode || (err.response && err.response.status);
        if (status === 401) {
          console.warn("Unauthorized customer token. Logging out.");
          this.logout();
          return;
        }

        if (typeof window !== "undefined") {
          const localBookings = window.localStorage.getItem("splendor_bookings");
          const localBookingsList = localBookings ? JSON.parse(localBookings) : [];
          this.customerBookings = localBookingsList.filter((b: any) => 
            b.customerId === this.customer?.id || 
            b.customer?.phoneNumber === this.customer?.phoneNumber
          );
        }
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(name: string) {
      this.loading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response: any = await $fetch(`${config.public.apiBase}/auth/customer/update-profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: { name },
        });

        if (response.success) {
          this.customer = response.customer;
          this.saveSession();
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "სახელის განახლება ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("API updateProfile failed, falling back to local simulation:", err);
        
        // Offline Simulation
        if (this.customer) {
          this.customer.name = name;
          this.saveSession();
          
          // Also update in localUsers list
          const matchIndex = this.localUsers.findIndex(u => u.id === this.customer?.id || u.phoneNumber === this.customer?.phoneNumber);
          if (matchIndex !== -1) {
            this.localUsers[matchIndex].name = name;
            if (typeof window !== "undefined") {
              window.localStorage.setItem("splendor_customer_users", JSON.stringify(this.localUsers));
            }
          }
          
          this.loading = false;
          return { success: true };
        }
        
        this.error = "მომხმარებელი არ არის ავტორიზებული.";
        this.loading = false;
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
  },
});
