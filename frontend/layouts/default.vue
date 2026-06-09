<template>
  <header class="sticky top-0 z-50 glass-panel border-b border-brand-200/20 py-4 px-6 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <!-- Animated Brand Indicator -->
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
      </span>
      <h1 class="text-xl font-bold tracking-wider text-brand-700 font-serif-brand">
        Splendor
      </h1>
    </div>
    <div class="flex items-center gap-4 text-xs font-bold tracking-wider text-brand-600">
      <NuxtLink to="/" class="hover:text-brand-500 transition" active-class="text-brand-500">BOOK NOW</NuxtLink>
      <NuxtLink to="/admin" class="hover:text-brand-500 transition" active-class="text-brand-500">DASHBOARD</NuxtLink>
    </div>
  </header>

  <main class="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
    <slot />
  </main>

  <footer class="py-6 text-center text-xs text-brand-500 border-t border-brand-200/20 bg-brand-100/30">
    <p>© 2026 Splendor Car Wash. All rights reserved.</p>
  </footer>
</template>

<script setup>
// Layout requires no complex states
</script>
