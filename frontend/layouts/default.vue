<template>
  <header class="sticky top-0 z-50 glass-panel border-b border-brand-200/20">
    <div class="mx-auto max-w-6xl w-full py-2.5 sm:py-3.5 px-3 sm:px-6 flex justify-between items-center">
      <!-- Logo -->
      <div class="flex items-center gap-1.5 sm:gap-2.5 select-none">
        <svg class="w-7 h-7 sm:w-[34px] sm:h-[34px]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="#2B8FD4"/>
          <path d="M10 28 C15 22 20 31 24 26 C28 21 33 30 38 24" stroke="white" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        </svg>
        <span class="brand-mark text-lg sm:text-3xl font-bold tracking-tight text-brand-700 font-serif-brand leading-none">Splendor</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 sm:gap-3">
        <!-- Language selector -->
        <div class="glass-card rounded-full p-0.5 sm:p-1 flex text-[10px] sm:text-xs font-bold shrink-0 h-8 sm:h-10 items-center">
          <button
            @click="localeStore.setLocale('ka')"
            class="px-2 sm:px-3 h-7 sm:h-8 rounded-full transition-all duration-200 flex items-center justify-center"
            :class="[localeStore.locale === 'ka' ? 'bg-brand-500 text-white font-semibold shadow-sm' : 'text-brand-500 hover:text-brand-700']"
          >
            ქარ
          </button>
          <button
            @click="localeStore.setLocale('en')"
            class="px-2 sm:px-3 h-7 sm:h-8 rounded-full transition-all duration-200 flex items-center justify-center"
            :class="[localeStore.locale === 'en' ? 'bg-brand-500 text-white font-semibold shadow-sm' : 'text-brand-500 hover:text-brand-700']"
          >
            ENG
          </button>
        </div>

        <!-- Profile indicator -->
        <div v-if="customerAuth.isAuthenticated" class="shrink-0">
          <button
            @click="openCabinet"
            class="glass-card rounded-full pl-0.5 pr-0.5 sm:pl-1 sm:pr-4 h-8 sm:h-10 w-8 sm:w-auto flex items-center justify-center sm:justify-start gap-0 sm:gap-2 hover:scale-[1.03] transition-transform duration-200"
          >
            <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center font-bold text-[10px] sm:text-sm bg-brand-gradient text-white shrink-0">
              {{ customerAuth.customer?.name.trim().charAt(0).toUpperCase() }}
            </span>
            <span class="hidden sm:inline text-sm font-semibold text-brand-700 max-w-[120px] truncate">
              {{ customerAuth.customer?.name }}
            </span>
          </button>
        </div>
        <div v-else class="shrink-0">
          <button
            @click="triggerSignIn"
            class="glass-card rounded-full px-2.5 sm:px-4 h-8 sm:h-10 text-[10px] sm:text-xs font-bold hover:border-brand-500/50 hover:text-brand-500 transition-all flex items-center justify-center"
          >
            {{ localeStore.t('signIn') }}
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 w-full">
    <slot />
  </main>

  <footer class="py-6 text-center text-xs text-brand-500 border-t border-brand-200/20 bg-brand-100/30 w-full">
    <p>© 2026 Splendor Car Wash. All rights reserved.</p>
  </footer>

  <!-- Floating Chat Assistant Widget -->
  <ChatWidget />

  <!-- Toasts Container Overlay -->
  <div class="fixed bottom-6 right-6 space-y-3 z-[9999] w-full max-w-sm px-4 sm:px-0 pointer-events-none">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in notificationStore.activeToasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-4 p-4 rounded-2xl border border-brand-200/70 shadow-2xl bg-white/95 backdrop-blur-xl relative overflow-hidden group cursor-pointer transition duration-300 hover:scale-[1.02]"
        :class="[
          toast.type === 'success' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-brand-500'
        ]"
        @click="notificationStore.clearToast(toast.id)"
      >
        <!-- Toast Close Button -->
        <button 
          @click.stop="notificationStore.clearToast(toast.id)" 
          class="absolute top-2 right-2 text-brand-400 hover:text-brand-600 p-1 rounded-lg transition focus:outline-none"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <!-- Icon -->
        <div class="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white mt-0.5 shadow-sm"
          :class="[
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-brand-500'
          ]"
        >
          <Check v-if="toast.type === 'success'" class="w-4 h-4" />
          <Info v-else class="w-4 h-4" />
        </div>

        <!-- Content -->
        <div class="flex-grow min-w-0 pr-4">
          <h4 class="text-xs font-black text-[#0C447C] leading-snug">{{ toast.title }}</h4>
          <p class="text-[11px] text-brand-600 mt-1 leading-relaxed font-semibold">{{ toast.body }}</p>
          
          <!-- Image (if present) -->
          <div v-if="toast.image" class="mt-2.5 rounded-xl overflow-hidden max-w-full border border-brand-100/50 shadow-sm bg-slate-50">
            <img :src="toast.image" class="w-full h-auto object-cover max-h-[120px]" alt="Notification Image" />
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { X, Check, Info } from 'lucide-vue-next'
import { useLocaleStore } from '~/stores/localeStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useNotificationStore } from '~/stores/notificationStore'

const localeStore = useLocaleStore()
const customerAuth = useCustomerAuthStore()
const notificationStore = useNotificationStore()

onMounted(async () => {
  if (typeof window !== 'undefined') {
    notificationStore.initializeStore()
    
    // Prompt for notification permission automatically on mount if not decided yet
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log("🔔 Prompting user for notification permission...");
        await notificationStore.requestDesktopPermission()
      } else if (Notification.permission === 'granted') {
        await notificationStore.registerFCMToken()
      }
    }
  }
})

function triggerSignIn() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('splendor:open-auth'))
  }
}

function openCabinet() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('splendor:open-cabinet'))
  }
}
</script>

<style scoped>
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.95);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
