<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-transparent text-brand-750 font-sans">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 border-r border-brand-200 bg-white/50 backdrop-blur-lg flex flex-col justify-between shrink-0 p-6">
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
          <div class="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center font-bold text-white uppercase shadow-md shrink-0">
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
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <LayoutDashboard class="w-4 h-4" />
            <span>{{ localeStore.t('dashboard_stats') }}</span>
          </NuxtLink>

          <!-- Calendar Grid (Admin + Manager) -->
          <NuxtLink 
            to="/admin/calendar" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/calendar' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <Calendar class="w-4 h-4" />
            <span>{{ localeStore.t('live_calendar') }}</span>
          </NuxtLink>

          <!-- Service Matrix (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/services" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/services' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <Layers class="w-4 h-4" />
            <span>{{ localeStore.t('service_matrix') }}</span>
          </NuxtLink>

          <!-- Orders List (Admin + Manager) -->
          <NuxtLink 
            to="/admin/orders" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/orders' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <ClipboardList class="w-4 h-4" />
            <span>{{ localeStore.t('orders_list') }}</span>
          </NuxtLink>

          <!-- Registered Customers (Admin + Manager) -->
          <NuxtLink 
            to="/admin/customers" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/customers' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <UserCheck class="w-4 h-4" />
            <span>{{ localeStore.t('registered_customers') }}</span>
          </NuxtLink>

          <!-- Branches Management (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/branches" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/branches' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <Building class="w-4 h-4" />
            <span>{{ localeStore.t('manage_branches') }}</span>
          </NuxtLink>

          <!-- Users & Roles (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/users" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/users' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
          >
            <Users class="w-4 h-4" />
            <span>{{ localeStore.t('users_roles') }}</span>
          </NuxtLink>

          <!-- Settings (Admin only) -->
          <NuxtLink 
            v-if="authStore.isAdmin"
            to="/admin/settings" 
            class="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300"
            active-class="bg-brand-gradient text-white shadow-lg shadow-brand-500/15"
            :class="[route.path === '/admin/settings' ? '' : 'hover:bg-brand-100/40 text-brand-500 hover:text-brand-700']"
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
          class="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:bg-rose-50/70 text-rose-600 hover:text-rose-700 border border-transparent hover:border-rose-200/50"
        >
          <LogOut class="w-4 h-4" />
          <span>{{ localeStore.t('logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-grow flex flex-col min-w-0">
      <header class="h-16 border-b border-brand-200 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md relative z-40">
        <h2 class="text-lg font-bold tracking-wide text-[#0C447C] font-serif-brand uppercase">
          {{ pageTitle }}
        </h2>
        <div class="flex items-center gap-4">
          <!-- Notifications Bell -->
          <div class="relative">
            <button 
              @click="toggleDropdown" 
              class="relative p-2 text-brand-500 hover:text-brand-700 bg-brand-100/40 hover:bg-brand-100/80 border border-brand-200 hover:border-brand-500/50 rounded-xl transition duration-300 shrink-0 focus:outline-none"
            >
              <Bell class="w-4 h-4" />
              <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">
                {{ unreadCount }}
              </span>
            </button>
            
            <!-- Backdrop Click-Away -->
            <div v-if="showNotifDropdown" class="fixed inset-0 z-40" @click="showNotifDropdown = false"></div>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="showNotifDropdown" 
              class="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-brand-200/85 shadow-2xl z-50 overflow-hidden flex flex-col bg-white/95 backdrop-blur-xl transition-all duration-300"
            >
              <!-- Dropdown Header -->
              <div class="px-5 py-4 border-b border-brand-100 flex items-center justify-between bg-brand-50/50">
                <span class="font-black text-xs text-[#0C447C] tracking-wide uppercase">{{ localeStore.t('notifications') }}</span>
                <div class="flex items-center gap-3 text-[10px]">
                  <button @click="notificationStore.markAllAsRead" class="text-brand-500 hover:text-brand-700 font-bold transition">
                    {{ localeStore.t('mark_all_read') }}
                  </button>
                  <span class="text-brand-200">|</span>
                  <button @click="notificationStore.clearAllNotifications" class="text-rose-500 hover:text-rose-700 font-bold transition">
                    {{ localeStore.t('clear_all') }}
                  </button>
                </div>
              </div>
              
              <!-- Dropdown Items list -->
              <div class="max-h-80 overflow-y-auto divide-y divide-brand-100/50">
                <div v-if="notificationStore.notifications.length === 0" class="p-8 text-center text-xs text-brand-400 font-semibold">
                  {{ localeStore.t('no_notifications') }}
                </div>
                <div 
                  v-else 
                  v-for="notif in notificationStore.notifications" 
                  :key="notif.id"
                  @click="handleNotificationClick(notif)"
                  class="p-4 flex gap-3 hover:bg-brand-50/40 cursor-pointer transition duration-200"
                  :class="[notif.isRead ? 'opacity-60 bg-white/50' : 'bg-brand-500/5 font-medium']"
                >
                  <div class="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                    :class="[notif.type === 'create' ? 'bg-emerald-500' : 'bg-brand-500']"
                  >
                    <Calendar v-if="notif.type === 'create'" class="w-4 h-4" />
                    <RefreshCw v-else class="w-4 h-4" />
                  </div>
                  <div class="flex-grow min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-extrabold text-[#0C447C] truncate">{{ notif.title }}</span>
                      <span class="text-[9px] font-bold text-brand-400 shrink-0">{{ formatTime(notif.createdAt) }}</span>
                    </div>
                    <p class="text-[11px] text-brand-600 mt-1 line-clamp-2 leading-relaxed">{{ notif.body }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Permission Settings in Dropdown -->
              <div v-if="notificationStore.permissionStatus !== 'granted'" class="p-3 bg-brand-50/20 border-t border-brand-100/50 text-center">
                <button 
                  @click="notificationStore.requestDesktopPermission"
                  class="text-[11px] font-extrabold text-brand-600 hover:text-brand-700 underline focus:outline-none"
                >
                  {{ localeStore.t('enable_desktop_notifications') }}
                </button>
              </div>


            </div>
          </div>

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
          @click="handleToastClick(toast)"
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
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { LayoutDashboard, Calendar, Layers, ClipboardList, Users, LogOut, UserCheck, Building, Settings, Bell, RefreshCw, X, Check, Info } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { useLocaleStore } from '../stores/localeStore'
import { useNotificationStore } from '../stores/notificationStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const notificationStore = useNotificationStore()

const showNotifDropdown = ref(false)
const unreadCount = computed(() => notificationStore.notifications.filter(n => !n.isRead).length)

function toggleDropdown() {
  showNotifDropdown.value = !showNotifDropdown.value
}

function handleNotificationClick(notif) {
  showNotifDropdown.value = false
  notif.isRead = true
  notificationStore.saveHistory()
  router.push('/admin/orders')
}

function handleToastClick(toast) {
  notificationStore.clearToast(toast.id)
  router.push('/admin/orders')
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString(localeStore.locale === 'ka' ? 'ka-GE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

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

const handleLogout = async () => {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  localeStore.initialize()
  authStore.initialize()
  notificationStore.initListener()
})
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
