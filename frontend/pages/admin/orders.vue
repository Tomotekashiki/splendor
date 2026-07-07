<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Header Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div>
          <h3 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('orders_management') }}</h3>
          <p class="text-xs text-brand-500 mt-1 font-medium">Track, filter, and manage all car wash appointments</p>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <!-- Search Bar -->
          <div class="relative w-full sm:w-64">
            <span class="absolute left-3 top-2.5 text-xs text-brand-500">🔍</span>
            <input 
              type="text" 
              :placeholder="localeStore.t('search_placeholder')"
              v-model="searchQuery"
              class="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-xs placeholder-brand-400/80"
            />
          </div>
        </div>
      </div>

      <!-- Alert Notification Banners -->
      <div 
        v-if="adminStore.error" 
        class="px-4 py-3.5 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs font-semibold"
      >
        ⚠️ {{ adminStore.error }}
      </div>

      <!-- Filters Section -->
      <div class="flex flex-wrap items-center gap-3.5 bg-brand-100/20 border border-brand-100 rounded-2xl p-4">
        <!-- Status Filter -->
        <div class="space-y-1">
          <label class="text-[9px] font-bold text-brand-500 uppercase tracking-widest block">{{ localeStore.t('filter_status') }}</label>
          <div class="flex gap-1.5">
            <button 
              v-for="status in ['all', 'pending', 'in_progress', 'completed', 'cancelled']" 
              :key="status"
              @click="filterStatus = status"
              class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition"
              :class="[
                filterStatus === status 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-brand-100/40 text-brand-500 hover:bg-brand-200/40 hover:text-brand-700'
              ]"
            >
              {{ status === 'all' ? localeStore.t('all_statuses') : localeStore.t(status === 'in_progress' ? 'in_progress' : status === 'completed' ? 'completed_status' : status) }}
            </button>
          </div>
        </div>

        <div class="h-8 w-[1px] bg-brand-100/40 hidden md:block"></div>

        <!-- Payment Status Filter -->
        <div class="space-y-1">
          <label class="text-[9px] font-bold text-brand-500 uppercase tracking-widest block">{{ localeStore.t('filter_payment') }}</label>
          <div class="flex gap-1.5">
            <button 
              v-for="pstatus in ['all', 'paid', 'unpaid', 'failed']" 
              :key="pstatus"
              @click="filterPayment = pstatus"
              class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition"
              :class="[
                filterPayment === pstatus 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-brand-100/40 text-brand-500 hover:bg-brand-200/40 hover:text-brand-700'
              ]"
            >
              {{ pstatus === 'all' ? localeStore.t('all_payments') : localeStore.t(pstatus === 'completed' ? 'completed_status' : pstatus) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Orders Table Card -->
      <div class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden">
        <!-- Skeleton Loader state -->
        <div v-if="adminStore.loading" class="min-h-[300px]">
          <div class="overflow-x-auto">
            <div class="border-b border-brand-100 pb-3 flex justify-between animate-pulse">
              <div class="w-16 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-1/4 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-1/5 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-1/4 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-16 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-16 h-3 bg-slate-200/80 rounded"></div>
              <div class="w-24 h-3 bg-slate-200/80 rounded"></div>
            </div>
            <div class="divide-y divide-brand-100">
              <div v-for="n in 4" :key="n" class="py-4 flex justify-between items-center animate-pulse">
                <div class="w-16 h-3 bg-slate-200/60 rounded"></div>
                <div class="w-1/4 h-3.5 bg-slate-200/50 rounded"></div>
                <div class="w-1/5 h-3 bg-slate-200/60 rounded"></div>
                <div class="w-1/4 h-3 bg-slate-200/60 rounded"></div>
                <div class="w-16 h-3.5 bg-slate-200/65 rounded"></div>
                <div class="w-16 h-4 bg-slate-200/50 rounded-full"></div>
                <div class="w-24 h-6.5 bg-slate-200/40 rounded-lg"></div>
              </div>
            </div>
          </div>

          <!-- Spinner Loader overlay -->
          <div class="absolute inset-0 bg-[#F8FAFC]/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10 pointer-events-none rounded-2xl">
            <div class="inline-block animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full shadow-sm"></div>
            <span class="text-[9px] text-[#0C447C] font-black uppercase tracking-widest animate-pulse">
              {{ localeStore.t('loading_data') }}
            </span>
          </div>
        </div>

        <div v-else-if="filteredBookings.length === 0" class="text-center py-16">
          <span class="text-3xl">📋</span>
          <p class="text-xs text-brand-500 font-bold mt-2">{{ localeStore.t('no_orders') }}</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr class="border-b border-brand-100 text-brand-500 font-bold uppercase tracking-wider">
                <th class="pb-3 font-semibold">{{ localeStore.t('order_id') }}</th>
                <th class="pb-3 font-semibold">{{ localeStore.t('client') }}</th>
                <th class="pb-3 font-semibold">{{ localeStore.t('scheduled') }}</th>
                <th class="pb-3 font-semibold">{{ localeStore.t('step_services') }}</th>
                <th class="pb-3 font-semibold">{{ localeStore.t('price') }} / {{ localeStore.t('payment') }}</th>
                <th class="pb-3 font-semibold">{{ localeStore.t('status') }}</th>
                <th class="pb-3 font-semibold text-right">{{ localeStore.t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-100">
              <tr 
                v-for="booking in filteredBookings" 
                :key="booking.id" 
                class="hover:bg-brand-100/40 transition duration-150 group"
              >
                <!-- Booking ID & Bay -->
                <td class="py-4 font-bold align-middle text-[#0C447C]">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[#2B8FD4] font-black text-sm">{{ booking.bookingId }}</span>
                    <span class="text-[9px] font-semibold text-brand-500 uppercase tracking-wide">
                      🏠 {{ getBayName(booking.washingBayId) }}
                    </span>
                    <span v-if="booking.branch" class="text-[9px] font-bold text-brand-600 mt-0.5">
                      🏢 {{ typeof booking.branch === 'object' ? localeStore.t(booking.branch?.name) : localeStore.t(booking.branch) }}
                    </span>
                    <span v-if="booking.createdAt" class="text-[9px] font-medium text-brand-400 mt-0.5">
                      📅 {{ localeStore.locale === 'ka' ? 'შექმნილია:' : 'Created:' }} {{ formatDateHuman(booking.createdAt) }}
                    </span>
                  </div>
                </td>

                <!-- Customer Details -->
                <td class="py-4 align-middle">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-bold text-brand-700 text-xs">{{ booking.customer?.name }}</span>
                    <span class="text-[10px] text-brand-400 font-medium">{{ booking.customer?.phoneNumber }}</span>
                  </div>
                </td>

                <!-- Appointment Date & Vehicle info -->
                <td class="py-4 align-middle">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold text-brand-600">{{ formatDateHuman(booking.startTime) }}</span>
                    <span class="text-[10px] text-brand-400">
                      🚗 {{ localeStore.t(booking.vehicleType?.name) }}
                    </span>
                  </div>
                </td>

                <!-- Services list -->
                <td class="py-4 align-middle">
                  <div class="flex flex-wrap gap-1 max-w-[200px]">
                    <span 
                      v-for="bs in booking.bookingServices" 
                      :key="bs.serviceId"
                      class="px-1.5 py-0.5 rounded bg-white border border-brand-100 text-[9px] font-bold text-brand-500"
                    >
                      {{ bs.service ? localeStore.t(bs.service.title || bs.service.name) : '' }}
                    </span>
                  </div>
                </td>

                <!-- Price and Payment Status Dropdown -->
                <td class="py-4 align-middle">
                  <div class="flex flex-col gap-1.5">
                    <span class="font-extrabold text-[#0C447C] text-xs">{{ localeStore.formatPrice(booking.totalPrice) }}</span>
                    <div class="relative w-28">
                      <select 
                        :value="booking.paymentStatus"
                        @change="onPaymentStatusChanged(booking.id, $event.target.value)"
                        class="w-full bg-white/95 border border-brand-200 text-[10px] font-bold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[#0C447C] cursor-pointer appearance-none shadow-sm transition-all duration-200 hover:border-brand-300"
                      >
                        <option value="unpaid">{{ localeStore.t('unpaid') }}</option>
                        <option value="paid">{{ localeStore.t('paid') }}</option>
                        <option value="refunded">{{ localeStore.t('refunded') }}</option>
                        <option value="failed">{{ localeStore.t('failed') }}</option>
                      </select>
                      <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-brand-500">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Status Coordinate dropdown -->
                <td class="py-4 align-middle">
                  <div class="relative w-32">
                    <select 
                      :value="booking.status"
                      @change="handleStatusChange(booking, $event.target.value)"
                      class="w-full bg-white/95 border border-brand-200 text-[10px] font-bold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[#0C447C] cursor-pointer appearance-none shadow-sm transition-all duration-200 hover:border-brand-300"
                    >
                      <option value="pending">{{ localeStore.t('pending') }}</option>
                      <option value="in_progress">{{ localeStore.t('in_progress') }}</option>
                      <option value="completed">{{ localeStore.t('completed_status') }}</option>
                      <option value="cancelled">{{ localeStore.t('cancelled') }}</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-brand-500">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </td>

                <!-- Row Quick Actions -->
                <td class="py-4 text-right align-middle">
                  <button 
                    v-if="booking.status !== 'cancelled'"
                    @click="confirmCancel(booking)"
                    class="px-2.5 py-1.5 rounded-lg border border-rose-250 hover:border-rose-500 bg-rose-50/70 hover:bg-rose-500 text-rose-600 hover:text-white font-bold transition duration-200 text-[10px]"
                  >
                    {{ localeStore.t('cancel') }}
                  </button>
                  <span v-else class="text-rose-500 font-extrabold text-[10px] uppercase tracking-wider mr-2">
                    {{ localeStore.t('cancelled') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm Cancel Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm">
      <div class="glass-panel max-w-sm w-full rounded-3xl p-6 shadow-glass border border-brand-200 text-center space-y-4">
        <div class="w-12 h-12 rounded-full bg-rose-50/70 flex items-center justify-center text-rose-500 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('cancel_title') }}</h4>
          <p class="text-xs text-brand-500 mt-1.5 leading-relaxed">
            {{ localeStore.t('confirm_cancel_order') }}
          </p>
        </div>
        <div class="flex gap-2">
          <button 
            @click="cancelReset"
            class="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-bold w-1/2"
          >
            {{ localeStore.t('cancel') }}
          </button>
          <button 
            @click="executeCancel"
            class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold w-1/2 transition text-xs shadow-md"
          >
            {{ localeStore.t('continue') }}
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'

const adminStore = useAdminStore()
const bookingStore = useBookingStore()
const localeStore = useLocaleStore()

const searchQuery = ref('')
const filterStatus = ref('all')
const filterPayment = ref('all')

const showConfirmModal = ref(false)
const targetBooking = ref(null)

function confirmCancel(booking) {
  targetBooking.value = booking
  showConfirmModal.value = true
}

function cancelReset() {
  showConfirmModal.value = false
  targetBooking.value = null
  // Reset reactive table updates
  adminStore.bookings = [...adminStore.bookings]
}

async function executeCancel() {
  if (targetBooking.value) {
    await adminStore.updateStatus(targetBooking.value.id, { status: 'cancelled' })
    showConfirmModal.value = false
    targetBooking.value = null
  }
}

function handleStatusChange(booking, newStatus) {
  if (newStatus === 'cancelled') {
    confirmCancel(booking)
  } else {
    onStatusChanged(booking.id, newStatus)
  }
}

definePageMeta({
  layout: false
})

onMounted(async () => {
  localeStore.initialize()
  const promises = [adminStore.fetchDashboardData()]
  if (bookingStore.washingBays.length === 0) {
    promises.push(bookingStore.loadServiceGrid())
  }
  await Promise.all(promises)
})

function getBayName(bayId) {
  const bay = bookingStore.washingBays.find(b => b.id === bayId)
  return bay ? localeStore.t(bay.name) : 'Box'
}

const filteredBookings = computed(() => {
  return adminStore.bookings.filter(b => {
    // Search query match
    const clientName = b.customer?.name?.toLowerCase() || ''
    const clientPhone = b.customer?.phoneNumber || ''
    const bId = b.bookingId?.toLowerCase() || ''
    const sTerm = searchQuery.value.toLowerCase()

    const matchesSearch = clientName.includes(sTerm) || 
                          clientPhone.includes(sTerm) || 
                          bId.includes(sTerm)

    // Status filter match
    const matchesStatus = filterStatus.value === 'all' || b.status === filterStatus.value

    // Payment Status filter match
    const matchesPayment = filterPayment.value === 'all' || b.paymentStatus === filterPayment.value

    return matchesSearch && matchesStatus && matchesPayment
  }).sort((a, b) => new Date(b.createdAt || b.startTime || 0).getTime() - new Date(a.createdAt || a.startTime || 0).getTime()) // Sort newest first
})

async function onStatusChanged(bookingId, newStatus) {
  await adminStore.updateStatus(bookingId, { status: newStatus })
}

async function onPaymentStatusChanged(bookingId, newPaymentStatus) {
  await adminStore.updateStatus(bookingId, { paymentStatus: newPaymentStatus })
}

function formatDateHuman(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const monthsKa = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"]
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const months = localeStore.locale === 'ka' ? monthsKa : monthsEn
  const monthStr = months[date.getUTCMonth()]
  const dayStr = date.getUTCDate()
  const yearStr = date.getUTCFullYear()
  return `${dayStr} ${monthStr} ${yearStr} @ ${hour}:${min}`
}
</script>
