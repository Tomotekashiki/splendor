<template>
  <header class="sticky top-0 z-50 glass-panel border-b border-brand-200/20">
    <div class="mx-auto max-w-6xl w-full py-3.5 px-6 flex justify-between items-center">
      <!-- Logo -->
      <div class="flex items-center gap-2.5 select-none">
        <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="#2B8FD4"/>
          <path d="M10 28 C15 22 20 31 24 26 C28 21 33 30 38 24" stroke="white" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        </svg>
        <span class="brand-mark text-3xl font-bold tracking-tight text-brand-700 font-serif-brand leading-none">Splendor</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Language selector -->
        <div class="glass-card rounded-full p-1 flex text-xs font-bold shrink-0 h-10 items-center">
          <button
            @click="localeStore.setLocale('ka')"
            class="px-3 h-8 rounded-full transition-all duration-200 flex items-center justify-center"
            :class="[localeStore.locale === 'ka' ? 'bg-brand-500 text-white font-semibold shadow-sm' : 'text-brand-500 hover:text-brand-700']"
          >
            ქარ
          </button>
          <button
            @click="localeStore.setLocale('en')"
            class="px-3 h-8 rounded-full transition-all duration-200 flex items-center justify-center"
            :class="[localeStore.locale === 'en' ? 'bg-brand-500 text-white font-semibold shadow-sm' : 'text-brand-500 hover:text-brand-700']"
          >
            ENG
          </button>
        </div>

        <!-- Profile indicator -->
        <div v-if="customerAuth.isAuthenticated" class="shrink-0">
          <button
            @click="openCabinet"
            class="glass-card rounded-full pl-1 pr-4 h-10 flex items-center gap-2 hover:scale-[1.03] transition-transform duration-200"
          >
            <span class="w-8 h-8 rounded-full grid place-items-center font-bold text-sm bg-brand-gradient text-white">
              {{ customerAuth.customer?.name.trim().charAt(0).toUpperCase() }}
            </span>
            <span class="text-sm font-semibold text-brand-700 max-w-[120px] truncate">
              {{ customerAuth.customer?.name }}
            </span>
          </button>
        </div>
        <div v-else class="shrink-0">
          <button
            @click="triggerSignIn"
            class="glass-card rounded-full px-4 h-10 text-xs font-bold hover:border-brand-500/50 hover:text-brand-500 transition-all flex items-center justify-center"
          >
            {{ localeStore.t('signIn') }}
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-grow flex flex-col items-center justify-center p-4 md:p-8 w-full">
    <slot />
  </main>

  <footer class="py-6 text-center text-xs text-brand-500 border-t border-brand-200/20 bg-brand-100/30 w-full">
    <p>© 2026 Splendor Car Wash. All rights reserved.</p>
  </footer>
</template>

<script setup>
import { useLocaleStore } from '~/stores/localeStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'

const localeStore = useLocaleStore()
const customerAuth = useCustomerAuthStore()

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
