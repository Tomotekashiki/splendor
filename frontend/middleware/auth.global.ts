import { useAuthStore } from "../stores/authStore";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // Safe to call (contains internal typeof window !== 'undefined' checks)
  authStore.initialize();

  const path = to.path.replace(/\/$/, ""); // Normalize trailing slashes

  if (path.startsWith("/admin")) {
    const isAuthenticated = authStore.isAuthenticated;
    const isLoginPath = path === "/admin/login";

    if (!isAuthenticated && !isLoginPath) {
      return navigateTo("/admin/login");
    }

    if (isAuthenticated && isLoginPath) {
      if (authStore.isAdmin) {
        return navigateTo("/admin");
      } else {
        return navigateTo("/admin/calendar");
      }
    }

    // Role restrictions for managers
    if (isAuthenticated && authStore.isManager) {
      const restricted = ["/admin", "/admin/services", "/admin/users", "/admin/branches", "/admin/settings"];
      if (restricted.includes(path)) {
        return navigateTo("/admin/calendar");
      }
    }
  }
});
