import { defineStore } from "pinia";

export interface User {
  id: string;
  username: string;
  role: "admin" | "manager";
  password?: string; // used for local/offline authentication fallback
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
          // Restore session
          const sessionRaw = window.localStorage.getItem("splendor_admin_session");
          if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            let isExpired = false;
            try {
              const token = session.token;
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
              console.error("Error decoding token for expiration check:", e);
            }

            if (isExpired) {
              console.warn("Stored token is expired. Clearing session.");
              this.user = null;
              this.token = null;
              window.localStorage.removeItem("splendor_admin_session");
            } else {
              this.user = session.user;
              this.token = session.token;
            }
          }

          // Restore or seed offline users database
          const usersRaw = window.localStorage.getItem("splendor_admin_users");
          if (usersRaw) {
            this.usersList = JSON.parse(usersRaw);
          } else {
            // Seed defaults
            const defaultUsers: User[] = [
              {
                id: "u-admin",
                username: "admin",
                role: "admin",
                password: "admin",
                createdAt: new Date().toISOString(),
              },
              {
                id: "u-manager",
                username: "manager",
                role: "manager",
                password: "manager",
                createdAt: new Date().toISOString(),
              },
            ];
            this.usersList = defaultUsers;
            window.localStorage.setItem("splendor_admin_users", JSON.stringify(defaultUsers));
          }
        } catch (e) {
          console.error("Failed to initialize auth store from localStorage:", e);
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
      } catch (err: any) {
        console.warn("Backend API login failed. Attempting offline fallback auth check...", err);
      }

      // Offline fallback validation
      const matched = this.usersList.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (matched) {
        this.user = {
          id: matched.id,
          username: matched.username,
          role: matched.role,
          createdAt: matched.createdAt,
        };
        // Simple mock JWT token
        this.token = `mock-session-${matched.id}-${Date.now()}`;

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
      this.loading = false;
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
          // Keep passwords from offline DB if matching usernames, to preserve offline login credentials
          const updatedUsers = response.users.map((u: any) => {
            const existing = this.usersList.find((ex) => ex.id === u.id || ex.username === u.username);
            return {
              ...u,
              password: existing ? existing.password : "password", // fallback password placeholder for offline
            };
          });
          this.usersList = updatedUsers;
          if (typeof window !== "undefined") {
            window.localStorage.setItem("splendor_admin_users", JSON.stringify(updatedUsers));
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch users from API. Falling back to local copy.", err);
        // Fallback: reload from localStorage
        if (typeof window !== "undefined") {
          const localUsers = window.localStorage.getItem("splendor_admin_users");
          if (localUsers) {
            this.usersList = JSON.parse(localUsers);
          }
        }
      } finally {
        this.loading = false;
      }
    },

    async createUser(userPayload: Omit<User, "id"> & { password?: string }) {
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
          const newUser = {
            ...response.user,
            password: userPayload.password || "password",
          };
          this.usersList.push(newUser);
          this.saveUsersToLocalStorage();
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "მომხმარებლის შექმნა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("Failed to create user via API. Performing local offline create.", err);
      }

      // Check duplicates locally
      const exists = this.usersList.find(
        (u) => u.username.toLowerCase() === userPayload.username.toLowerCase()
      );
      if (exists) {
        this.error = "Username already exists.";
        this.loading = false;
        return { success: false, error: this.error };
      }

      // Offline simulation
      const newLocalUser: User = {
        id: `u-${Date.now()}`,
        username: userPayload.username,
        role: userPayload.role,
        password: userPayload.password || "password",
        createdAt: new Date().toISOString(),
      };
      this.usersList.push(newLocalUser);
      this.saveUsersToLocalStorage();
      this.loading = false;
      return { success: true };
    },

    async updateUser(id: string, userPayload: Partial<User> & { password?: string }) {
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
              password: userPayload.password || this.usersList[index].password,
            };
            this.saveUsersToLocalStorage();
          }
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "მომხმარებლის განახლება ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("Failed to update user via API. Performing local offline update.", err);
      }

      // Check duplicates locally if name is changing
      if (userPayload.username) {
        const exists = this.usersList.find(
          (u) => u.id !== id && u.username.toLowerCase() === userPayload.username!.toLowerCase()
        );
        if (exists) {
          this.error = "Username already exists.";
          this.loading = false;
          return { success: false, error: this.error };
        }
      }

      // Offline simulation
      const index = this.usersList.findIndex((u) => u.id === id);
      if (index !== -1) {
        this.usersList[index] = {
          ...this.usersList[index],
          ...userPayload,
        };
        this.saveUsersToLocalStorage();
      }
      this.loading = false;
      return { success: true };
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
          this.saveUsersToLocalStorage();
          this.loading = false;
          return { success: true };
        }
      } catch (err: any) {
        if (err.status) {
          this.error = err.data?.error || "მომხმარებლის წაშლა ვერ მოხერხდა.";
          this.loading = false;
          return { success: false, error: this.error };
        }
        console.warn("Failed to delete user via API. Performing local offline delete.", err);
      }

      // Offline simulation
      this.usersList = this.usersList.filter((u) => u.id !== id);
      this.saveUsersToLocalStorage();
      this.loading = false;
      return { success: true };
    },

    saveUsersToLocalStorage() {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("splendor_admin_users", JSON.stringify(this.usersList));
        } catch (e) {
          console.error("Failed to save users to localStorage:", e);
        }
      }
    },
  },
});
