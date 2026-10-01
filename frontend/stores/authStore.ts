import { defineStore } from "pinia";

export interface User {
  id: string;
  username: string;
  role: "admin" | "manager";
  createdAt?: string;
}

export const useAuthStore = defineStore("authStore", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    usersList: [] as User[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === "admin",
    isManager: (state) => state.user?.role === "manager",
  },

  actions: {
    initialize() {
      if (typeof window !== "undefined") {
        try {
          // Remove insecure legacy plaintext credentials if stored in localStorage
          if (window.localStorage.getItem("splendor_admin_users")) {
            window.localStorage.removeItem("splendor_admin_users");
          }

          // Restore session
          const sessionRaw = window.localStorage.getItem("splendor_admin_session");
          if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            let isExpired = false;
            try {
              const token = session.token;
              if (token) {
                const parts = token.split(".");
                if (parts.length === 3) {
                  const base64Url = parts[1];
                  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                  const payload = JSON.parse(window.atob(base64));
                  if (payload.exp && payload.exp < Date.now()) {
                    isExpired = true;
                  }
                } else {
                  // Invalid token format
                  isExpired = true;
                }
              } else {
                isExpired = true;
              }
            } catch (e) {
              console.error("Error decoding token for expiration check:", e);
              isExpired = true;
            }

            if (isExpired) {
              console.warn("Stored token is expired or invalid. Clearing session.");
              this.user = null;
              this.token = null;
              window.localStorage.removeItem("splendor_admin_session");
            } else {
              this.user = session.user;
              this.token = session.token;
            }
          }
        } catch (e) {
          console.error("Failed to initialize auth store:", e);
        }
      }
    },

    async login(username: string, password: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/auth/admin/login`, {
          method: "POST",
          body: { username, password },
        });

        if (response && response.success) {
          this.user = response.user;
          this.token = response.token;

          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "splendor_admin_session",
              JSON.stringify({ user: this.user, token: this.token })
            );
          }
          this.loading = false;
          return true;
        }
        this.error = "Invalid username or password.";
      } catch (err: any) {
        this.error = err.data?.error || "Invalid username or password.";
      } finally {
        this.loading = false;
      }

      return false;
    },

    logout() {
      this.user = null;
      this.token = null;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("splendor_admin_session");
      }
    },

    async fetchUsers() {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/users`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        if (response && response.success) {
          this.usersList = response.users;
        }
      } catch (err: any) {
        console.warn("Failed to fetch users from API:", err);
      } finally {
        this.loading = false;
      }
    },

    async createUser(userPayload: { username: string; role: "admin" | "manager"; password?: string }) {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: userPayload,
        });

        if (response && response.success) {
          this.usersList.push(response.user);
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        this.error = err.data?.error || "მომხმარებლის შექმნა ვერ მოხერხდა.";
        this.loading = false;
        return { success: false, error: this.error };
      }

      this.loading = false;
      return { success: false, error: "მომხმარებლის შექმნა ვერ მოხერხდა." };
    },

    async updateUser(id: string, userPayload: { username?: string; role?: "admin" | "manager"; password?: string }) {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/users/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: userPayload,
        });

        if (response && response.success) {
          const index = this.usersList.findIndex((u) => u.id === id);
          if (index !== -1) {
            this.usersList[index] = {
              ...this.usersList[index],
              ...response.user,
            };
          }
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        this.error = err.data?.error || "მომხმარებლის განახლება ვერ მოხერხდა.";
        this.loading = false;
        return { success: false, error: this.error };
      }

      this.loading = false;
      return { success: false, error: "მომხმარებლის განახლება ვერ მოხერხდა." };
    },

    async deleteUser(id: string) {
      this.loading = true;
      this.error = null;
      const config = useRuntimeConfig();

      try {
        const response: any = await $fetch(`${config.public.apiBase}/admin/users/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (response && response.success) {
          this.usersList = this.usersList.filter((u) => u.id !== id);
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        this.error = err.data?.error || "მომხმარებლის წაშლა ვერ მოხერხდა.";
        this.loading = false;
        return { success: false, error: this.error };
      }

      this.loading = false;
      return { success: false, error: "მომხმარებლის წაშლა ვერ მოხერხდა." };
    },
  },
});
