<template>
  <NuxtLayout name="admin">
    <!-- Restricted for Managers -->
    <div v-if="authStore.isManager" class="flex flex-col items-center justify-center text-center py-20 px-6 max-w-lg mx-auto space-y-6">
      <div class="w-16 h-16 rounded-full bg-rose-50/70 border border-rose-500/20 flex items-center justify-center text-rose-450 text-2xl shadow-lg">
        🔒
      </div>
      <div>
        <h3 class="text-xl font-bold text-[#0C447C] font-sans">{{ localeStore.t('access_denied') }}</h3>
        <p class="text-brand-500 text-sm mt-2 leading-relaxed">
          {{ localeStore.t('access_denied_desc') }}
        </p>
      </div>
      <NuxtLink 
        to="/admin/calendar"
        class="bg-brand-500 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider block w-fit"
      >
        {{ localeStore.t('live_calendar') }}
      </NuxtLink>
    </div>

    <div v-else class="space-y-8">
      <!-- Loading / Error states -->
      <div v-if="adminStore.loading && adminStore.bookings.length === 0" class="text-center py-12">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm text-brand-500 font-semibold uppercase tracking-wider">{{ localeStore.t('syncing_stats') }}</p>
      </div>

      <div v-else-if="adminStore.error" class="p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-sm">
        ⚠️ {{ adminStore.error }}
      </div>

      <div v-else class="space-y-8">
        <!-- Stats Widgets -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Live Revenue -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-glass relative overflow-hidden group">
            <div class="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-8xl font-black">💵</div>
            <span class="text-xs font-bold text-brand-500 uppercase tracking-widest">{{ localeStore.t('today_revenue') }}</span>
            <span class="text-3xl font-extrabold text-brand-400 mt-2">{{ localeStore.formatPrice(adminStore.revenueToday) }}</span>
            <div class="text-[10px] text-brand-400 font-medium mt-3">{{ localeStore.t('revenue_desc') }}</div>
          </div>

          <!-- Pending bookings -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-glass relative overflow-hidden">
            <div class="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-8xl font-black text-amber-500">⏳</div>
            <span class="text-xs font-bold text-brand-500 uppercase tracking-widest">{{ localeStore.t('pending_wash') }}</span>
            <span class="text-3xl font-extrabold text-amber-400 mt-2">{{ adminStore.stats.pending }}</span>
            <div class="text-[10px] text-brand-400 font-medium mt-3">{{ localeStore.t('pending_desc') }}</div>
          </div>

          <!-- In progress bookings -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-glass relative overflow-hidden">
            <div class="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-8xl font-black text-blue-500">💦</div>
            <span class="text-xs font-bold text-brand-500 uppercase tracking-widest">{{ localeStore.t('in_progress') }}</span>
            <span class="text-3xl font-extrabold text-blue-400 mt-2">{{ adminStore.stats.inProgress }}</span>
            <div class="text-[10px] text-brand-400 font-medium mt-3">{{ localeStore.t('in_progress_desc') }}</div>
          </div>

          <!-- Completed bookings -->
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-glass relative overflow-hidden">
            <div class="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-8xl font-black text-emerald-500">✅</div>
            <span class="text-xs font-bold text-brand-500 uppercase tracking-widest">{{ localeStore.t('completed_status') }}</span>
            <span class="text-3xl font-extrabold text-emerald-400 mt-2">{{ adminStore.stats.completed }}</span>
            <div class="text-[10px] text-brand-400 font-medium mt-3">{{ localeStore.t('completed_desc') }}</div>
          </div>
        </div>

        <!-- Secondary grid (Live Feeds & CRM) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Live Activity logger -->
          <div class="glass-panel rounded-2xl p-6 shadow-glass lg:col-span-1 flex flex-col h-[480px]">
            <div class="flex justify-between items-center mb-5">
              <h3 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('live_activity_log') }}</h3>
              <span class="text-[9px] font-extrabold tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                Broadcast
              </span>
            </div>

            <div v-if="logs.length === 0" class="flex-grow flex flex-col items-center justify-center text-brand-400 text-center py-6">
              <span class="text-2xl mb-1">📡</span>
              <p class="text-xs font-bold">{{ localeStore.t('awaiting_bookings') }}</p>
            </div>

            <div class="flex-grow overflow-y-auto space-y-3.5 pr-1">
              <div 
                v-for="log in logs" 
                :key="log.id" 
                class="p-3.5 rounded-xl text-xs border"
                :class="[
                  log.type === 'create' 
                    ? 'bg-brand-500/5 border-brand-500/10 text-brand-700' 
                    : 'bg-amber-500/5 border-amber-500/10 text-amber-800'
                ]"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold uppercase tracking-wider text-[10px]">
                    {{ log.type === 'create' ? `✨ ${localeStore.t('new_booking_broadcast')}` : `✏️ ${localeStore.t('rescheduled_broadcast')}` }}
                  </span>
                  <span class="text-[9px] text-brand-400 font-semibold">{{ formatTime(log.timestamp) }}</span>
                </div>
                <p class="font-medium text-brand-700 leading-relaxed">{{ getLogMessage(log) }}</p>
              </div>
            </div>
          </div>

          <!-- CRM Module -->
          <div class="glass-panel rounded-2xl p-6 shadow-glass lg:col-span-2 flex flex-col h-[480px]">
            <h3 class="font-bold text-[#0C447C] text-base mb-5">{{ localeStore.t('crm_title') }}</h3>
            
            <div v-if="adminStore.crm.length === 0" class="flex-grow flex flex-col items-center justify-center text-brand-400 py-6">
              <span class="text-2xl mb-1">👥</span>
              <p class="text-xs font-bold">{{ localeStore.t('no_customers') }}</p>
            </div>

            <div v-else class="flex-grow overflow-y-auto pr-1">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-brand-100 text-brand-500 font-bold uppercase tracking-wider">
                    <th class="pb-3 font-semibold">{{ localeStore.t('customer_details') }}</th>
                    <th class="pb-3 font-semibold">{{ localeStore.t('visits') }}</th>
                    <th class="pb-3 font-semibold">{{ localeStore.t('ltv') }}</th>
                    <th class="pb-3 font-semibold text-right">{{ localeStore.t('actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-brand-100">
                  <tr v-for="customer in adminStore.crm" :key="customer.id" class="hover:bg-brand-100/30 transition duration-150">
                    <td class="py-3">
                      <span class="font-bold text-[#0C447C] block">{{ customer.name }}</span>
                      <span class="text-[10px] text-brand-500 font-medium tracking-wide">{{ customer.phoneNumber }}</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded bg-brand-100/60 border border-brand-200/50 text-[#0C447C] font-bold">
                        {{ customer.bookingsCount }} {{ localeStore.t('visits').toLowerCase() }}
                      </span>
                    </td>
                    <td class="py-3">
                      <span class="font-bold text-brand-500">{{ localeStore.formatPrice(customer.lifetimeValue) }}</span>
                    </td>
                    <td class="py-3 text-right">
                      <button 
                        @click="viewCustomerHistory(customer)"
                        class="px-3 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500 bg-brand-100/40 hover:bg-brand-500 text-brand-600 hover:text-white font-bold transition duration-200 text-[10px]"
                      >
                        {{ localeStore.t('view_history') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import { useAuthStore } from '~/stores/authStore'
import { useLocaleStore } from '~/stores/localeStore'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const logs = ref([])
const selectedCrmHistory = ref(null)

definePageMeta({
  layout: false
})

onMounted(async () => {
  localeStore.initialize()
  await adminStore.fetchDashboardData()

  // Grab injected WebSocket instance
  const { $socket } = useNuxtApp()

  if ($socket) {
    // Listen for WebSocket events from Express
    $socket.on('booking_created', (booking) => {
      adminStore.handleBookingCreated(booking)
      
      logs.value.unshift({
        id: Math.random().toString(),
        type: 'create',
        booking: booking,
        timestamp: new Date()
      })
    })

    $socket.on('booking_updated', (booking) => {
      adminStore.handleBookingUpdated(booking)

      logs.value.unshift({
        id: Math.random().toString(),
        type: 'update',
        booking: booking,
        timestamp: new Date()
      })
    })
  }
})

onUnmounted(() => {
  const { $socket } = useNuxtApp()
  if ($socket) {
    $socket.off('booking_created')
    $socket.off('booking_updated')
  }
})

function viewCustomerHistory(customer) {
  selectedCrmHistory.value = customer
}

function getLogMessage(log) {
  if (!log.booking) return ""
  const booking = log.booking
  const vtName = localeStore.t(booking.vehicleType?.name || 'Vehicle')
  const bayName = localeStore.t(booking.washingBay?.name || booking.washingBayId || 'Box')
  const branchInfo = booking.branch ? ` (${booking.branch})` : ''
  
  if (log.type === 'create') {
    if (localeStore.locale === 'ka') {
      return `კლიენტმა ${booking.customer?.name} დაჯავშნა რეცხვა ავტომობილისთვის ${booking.licensePlate} (${vtName}) ბოქსში ${bayName}${branchInfo}, დაწყების დროით ${formatTime(booking.startTime)}.`
    } else {
      return `Client ${booking.customer?.name} booked a wash for ${booking.licensePlate} (${vtName}) in ${bayName}${branchInfo} starting at ${formatTime(booking.startTime)}.`
    }
  } else {
    const statusText = localeStore.t(booking.status).toUpperCase()
    if (localeStore.locale === 'ka') {
      return `ჯავშანი ID ${booking.bookingId} (${booking.licensePlate}) განახლდა. სტატუსი: ${statusText}, ბოქსი: ${bayName}${branchInfo}.`
    } else {
      return `Booking ref ${booking.bookingId} for ${booking.licensePlate} was updated. Status: ${statusText}, bay: ${bayName}${branchInfo}.`
    }
  }
}

// Format time
function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}
</script>
