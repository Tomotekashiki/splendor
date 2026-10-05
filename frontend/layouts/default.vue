<template>
  <div class="relative min-h-screen flex flex-col">
    <!-- Cinematic Automotive Background Layer -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <picture>
        <source srcset="/images/carwash-bg.webp" type="image/webp" />
        <img 
          src="/images/carwash-bg.jpg" 
          alt="" 
          fetchpriority="high"
          loading="eager"
          decoding="async"
          class="w-full h-full object-cover object-center scale-105 filter blur-[1px] brightness-[0.72] contrast-[1.08] transition-all duration-700"
        />
      </picture>
      <!-- Soft Gradient Overlays for depth and contrast -->
      <div class="absolute inset-0 bg-gradient-to-b from-[#0C447C]/40 via-[#0C447C]/15 to-[#0C447C]/65"></div>
      <div class="absolute inset-0 bg-slate-950/15"></div>
    </div>

    <header class="sticky top-0 z-50 glass-panel border-b border-brand-200/20">
      <div class="mx-auto max-w-6xl w-full py-2.5 sm:py-3.5 px-3 sm:px-6 flex justify-between items-center">
        <!-- Logo -->
        <div class="flex items-center gap-1.5 sm:gap-2.5 select-none">
          <svg class="w-7 h-7 sm:w-[34px] sm:h-[34px]" width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
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
              aria-label="მომხმარებლის კაბინეტი"
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

    <main class="flex-grow flex flex-col items-center justify-start pt-3 sm:pt-6 pb-12 p-2 sm:p-4 md:p-8 w-full">
      <slot />
    </main>

    <footer style="content-visibility: auto; contain-intrinsic-size: 1px 70px;" class="py-6 text-center text-xs text-white/70 border-t border-white/10 bg-slate-950/40 backdrop-blur-md w-full mt-auto">
      <p>© 2026 Splendor Car Wash. All rights reserved.</p>
    </footer>
  </div>

  <!-- Floating Chat Assistant Widget -->
  <ChatWidget v-if="showChat" />

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
          aria-label="შეტყობინების დახურვა"
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
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { X, Check, Info } from 'lucide-vue-next'
import { useLocaleStore } from '~/stores/localeStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useNotificationStore } from '~/stores/notificationStore'

const ChatWidget = defineAsyncComponent(() => import('~/components/ChatWidget.vue'))
const showChat = ref(false)

const localeStore = useLocaleStore()
const customerAuth = useCustomerAuthStore()
const notificationStore = useNotificationStore()

onMounted(() => {
  if (typeof window !== 'undefined') {
    notificationStore.initializeStore()
    
    // Only register FCM token if already granted by user
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationStore.registerFCMToken()
    }

    // Lazy load ChatWidget on first interaction or when idle
    const loadChat = () => {
      if (!showChat.value) {
        showChat.value = true
      }
      window.removeEventListener('scroll', loadChat)
      window.removeEventListener('mousemove', loadChat)
      window.removeEventListener('touchstart', loadChat)
    }

    window.addEventListener('scroll', loadChat, { passive: true, once: true })
    window.addEventListener('mousemove', loadChat, { passive: true, once: true })
    window.addEventListener('touchstart', loadChat, { passive: true, once: true })

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        setTimeout(loadChat, 2000)
      })
    } else {
      setTimeout(loadChat, 3000)
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
