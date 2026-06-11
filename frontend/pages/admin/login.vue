<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-50 px-4 py-12">
    <!-- Glowing background elements -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-brand-200/40 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-300/30 rounded-full blur-[120px] pointer-events-none"></div>
    
    <!-- Login container -->
    <div class="relative w-full max-w-md">
      <!-- Language Switcher in Card Header -->
      <div class="flex justify-end mb-4">
        <button 
          @click="localeStore.toggleLocale" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500/50 bg-brand-100/40 hover:bg-brand-100/80 text-brand-600 hover:text-brand-700 text-xs font-bold transition duration-300 shrink-0"
        >
          <span>🌐</span>
          <span>{{ localeStore.locale === 'ka' ? 'EN' : 'ქარ' }}</span>
        </button>
      </div>

      <div class="glass-panel p-8 rounded-3xl shadow-glass flex flex-col items-center">
        <!-- Logo Header -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold tracking-wider text-brand-700 font-serif-brand uppercase">SPLENDOR</h1>
          <p class="text-brand-500 text-sm mt-1">{{ localeStore.t('admin_center') }}</p>
        </div>

        <!-- Error feedback -->
        <div 
          v-if="errorMessage" 
          class="w-full mb-6 px-4 py-3 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-sm flex items-center space-x-2 animate-pulse"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="w-full space-y-5">
          <div>
            <label class="block text-brand-600 text-xs font-semibold uppercase tracking-wider mb-2 ml-1" for="username">
              {{ localeStore.t('username') }}
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-450">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </span>
              <input 
                id="username"
                v-model="username" 
                type="text" 
                required 
                :placeholder="localeStore.t('username')" 
                class="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-base"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label class="block text-brand-600 text-xs font-semibold uppercase tracking-wider mb-2 ml-1" for="password">
              {{ localeStore.t('password') }}
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-brand-450">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </span>
              <input 
                id="password"
                v-model="password" 
                type="password" 
                required 
                :placeholder="localeStore.t('password')" 
                class="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-base"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="loading"
            class="bg-brand-500 w-full flex items-center justify-center space-x-2 font-bold px-6 py-4 rounded-xl mt-6 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>{{ localeStore.t('continue') }}</span>
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center text-xs text-brand-500">
        <p>Protected area. Default credentials enabled for system diagnostics.</p>
        <p class="mt-1">© 2026 Splendor Group. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { useLocaleStore } from "../../stores/localeStore";
import { useRouter } from "vue-router";

// Disable layout
definePageMeta({
  layout: false
});

const authStore = useAuthStore();
const localeStore = useLocaleStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  
  loading.value = true;
  errorMessage.value = "";
  
  try {
    const success = await authStore.login(username.value, password.value);
    if (success) {
      // Redirect based on role
      if (authStore.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/admin/calendar");
      }
    } else {
      errorMessage.value = authStore.error || "Authentication failed.";
    }
  } catch (error) {
    console.error("Login page error:", error);
    errorMessage.value = "An unexpected error occurred. Please try again.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  localeStore.initialize();
});
</script>
