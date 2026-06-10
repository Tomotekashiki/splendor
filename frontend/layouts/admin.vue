<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-transparent text-brand-700 font-sans">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 border-r border-brand-200 bg-brand-100/50 backdrop-blur-lg flex flex-col justify-between shrink-0 p-6">
      <div class="space-y-6">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <span class="relative flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-500"></span>
          </span>
          <div class="flex flex-col">
            <span class="text-lg font-black tracking-widest text-brand-gradient leading-none">SPLENDOR</span>
            <span class="text-[9px] font-bold tracking-widest text-brand-400 uppercase">
              {{ localeStore.t('admin_center') }}
            </span>
          </div>
        </div>

        <!-- User Profile Card -->
        <div v-if="authStore.user" class="glass-card p-4 rounded-2xl flex items-center gap-3 border border-brand-200">
          <div class="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center font-bold text-slate-950 uppercase shadow-md shadow-brand-500/10 shrink-0">
            {{ authStore.user.username.charAt(0) }}
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-brand-700 truncate">{{ authStore.user.username }}</span>
            <span 
              class="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit mt-1 border"
              :class="[authStore.isAdmin ? 'bg-brand-500/10 text-brand-600 border-brand-300/30' : 'bg-brand-200 text-brand-550 border-brand-300/30']"
            >
              {{ authStore.user.role === 'admin' ? localeStore.t('administrator') : localeStore.t('manager') }}
            </span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="space-y-2">
          <!-- Stats Dashboard (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <LayoutDashboard class="w-4 h-4" />
            <span>{{ localeStore.t('dashboard_stats') }}</span>
          </NuxtLink>

          <!-- Calendar Grid (Admin + Manager) -->
          <NuxtLink 
            to="/admin/calendar" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/calendar' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <Calendar class="w-4 h-4" />
            <span>{{ localeStore.t('live_calendar') }}</span>
          </NuxtLink>

          <!-- Service Matrix (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/services" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/services' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <Layers class="w-4 h-4" />
            <span>{{ localeStore.t('service_matrix') }}</span>
          </NuxtLink>

          <!-- Orders List (Admin + Manager) -->
          <NuxtLink 
            to="/admin/orders" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/orders' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <ClipboardList class="w-4 h-4" />
            <span>{{ localeStore.t('orders_list') }}</span>
          </NuxtLink>

          <!-- Registered Customers (Admin + Manager) -->
          <NuxtLink 
            to="/admin/customers" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/customers' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <UserCheck class="w-4 h-4" />
            <span>{{ localeStore.t('registered_customers') }}</span>
          </NuxtLink>

          <!-- Branches Management (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/branches" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/branches' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <Building class="w-4 h-4" />
            <span>{{ localeStore.t('manage_branches') }}</span>
          </NuxtLink>

          <!-- Users & Roles (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/users" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/users' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <Users class="w-4 h-4" />
            <span>{{ localeStore.t('users_roles') }}</span>
          </NuxtLink>

          <!-- Settings (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/settings" 
            class="flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-secondary/15"
            :class="[route.path === '/admin/settings' ? '' : 'hover:bg-brand-100/70 text-brand-500 hover:text-brand-700']"
          >
            <Settings class="w-4 h-4" />
            <span>{{ localeStore.t('settings') }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="space-y-4">
        <!-- Logout Button -->
        <button
          v-if="authStore.user"
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-transparent hover:border-rose-200"
        >
          <LogOut class="w-4 h-4" />
          <span>{{ localeStore.t('logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-grow flex flex-col min-w-0">
      <header class="h-16 border-b border-brand-200 flex items-center justify-between px-8 bg-white">
        <h2 class="text-lg font-bold tracking-wide text-brand-700 font-serif-brand uppercase">
          {{ pageTitle }}
        </h2>
        <div class="flex items-center gap-4">
          <!-- Language Switcher -->
          <button 
            @click="localeStore.toggleLocale" 
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500/50 bg-brand-100/40 hover:bg-brand-100/80 text-brand-600 hover:text-brand-700 text-xs font-bold transition duration-300 shrink-0"
          >
            <span>🌐</span>
            <span>{{ localeStore.locale === 'ka' ? 'EN' : 'ქარ' }}</span>
          </button>
        </div>
      </header>

      <main class="flex-grow p-8 overflow-y-auto min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { LayoutDashboard, Calendar, Layers, ClipboardList, Users, LogOut, UserCheck, Building, Settings } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { useLocaleStore } from '../stores/localeStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()

const pageTitle = computed(() => {
  if (route.path === '/admin') return localeStore.t('stats_overview')
  if (route.path === '/admin/calendar') return localeStore.t('bay_scheduling_grid')
  if (route.path === '/admin/services') return localeStore.t('dynamic_price_matrix')
  if (route.path === '/admin/orders') return localeStore.t('orders_management')
  if (route.path === '/admin/users') return localeStore.t('user_role_management')
  if (route.path === '/admin/customers') return localeStore.t('registered_customers')
  if (route.path === '/admin/branches') return localeStore.t('manage_branches')
  if (route.path === '/admin/settings') return localeStore.t('settings')
  return localeStore.t('admin_center')
})

const handleLogout = () => {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  localeStore.initialize()
  authStore.initialize()
})
</script>
