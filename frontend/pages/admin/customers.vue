<template>
  <NuxtLayout name="admin">
    <!-- Restricted for Managers? No, both Admin and Manager can see CRM data -->
    <div class="space-y-6">
      <!-- Header Area -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-[#0C447C] uppercase tracking-wide">
            {{ localeStore.t('registered_customers') }}
          </h3>
          <p class="text-brand-500 text-xs mt-1">{{ localeStore.t('crm_desc') }}</p>
        </div>
      </div>

      <!-- Alert Notification Banners -->
      <div 
        v-if="successMessage" 
        class="px-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
      >
        {{ successMessage }}
      </div>
      <div 
        v-if="errorMessage" 
        class="px-4 py-3.5 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-450 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
      >
        {{ errorMessage }}
      </div>
      <div 
        v-if="adminStore.error" 
        class="px-4 py-3.5 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
      >
        ⚠️ {{ adminStore.error }}
      </div>

      <!-- Filters & Search Bar -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="relative w-full sm:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400 text-sm">
            🔍
          </span>
          <input 
            type="text" 
            :placeholder="localeStore.locale === 'ka' ? 'მოძებნეთ კლიენტის სახელი ან ტელეფონის ნომერი...' : 'Search customer name or phone...'"
            v-model="searchQuery"
            class="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-xs"
          />
        </div>
        <div class="text-brand-500 text-xs font-bold uppercase shrink-0">
          {{ localeStore.t('total_customers_prefix') }} <span class="text-brand-400 font-extrabold text-sm">{{ filteredCustomers.length }}</span> {{ localeStore.t('total_customers_suffix') }}
        </div>
      </div>

      <!-- Loading / Empty / Data states -->
      <div v-if="adminStore.loading && adminStore.crm.length === 0" class="text-center py-16">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-xs text-brand-500 font-bold uppercase tracking-wider">{{ localeStore.t('loading_data') }}</p>
      </div>

      <div v-else-if="filteredCustomers.length === 0" class="text-center py-16 bg-brand-100/30 border border-brand-100 rounded-2xl">
        <span class="text-3xl">👥</span>
        <p class="text-xs text-brand-500 font-bold mt-3">{{ localeStore.t('no_customers') }}</p>
      </div>

      <!-- Customers Table -->
      <div v-else class="glass-panel rounded-2xl overflow-hidden border border-brand-100 shadow-glass">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-brand-100 bg-brand-100/30 text-[10px] uppercase font-bold tracking-wider text-brand-500">
                <th class="py-4 px-6">{{ localeStore.t('customer_details') }}</th>
                <th class="py-4 px-6">{{ localeStore.t('registration') }}</th>
                <th class="py-4 px-6">{{ localeStore.t('visits') }}</th>
                <th class="py-4 px-6">{{ localeStore.t('ltv') }}</th>
                <th class="py-4 px-6 text-right">{{ localeStore.t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-100 text-xs text-brand-600">
              <tr 
                v-for="customer in filteredCustomers" 
                :key="customer.id" 
                class="hover:bg-white/[0.02] transition duration-150"
              >
                <!-- Avatar & Name -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-brand-gradient text-slate-950 flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-md shadow-brand-500/10">
                      {{ customer.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-[#0C447C] text-sm">{{ customer.name }}</span>
                        <span 
                          v-if="customer.isBlocked"
                          class="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                        >
                          {{ localeStore.t('blocked') }}
                        </span>
                      </div>
                      <span class="text-[10px] text-brand-500 font-medium tracking-wide">{{ customer.phoneNumber }}</span>
                    </div>
                  </div>
                </td>


                <!-- Registration Date -->
                <td class="py-4 px-6 text-brand-500">
                  {{ formatRegDate(customer.createdAt) }}
                </td>

                <!-- Bookings count -->
                <td class="py-4 px-6">
                  <span class="px-2 py-0.5 rounded bg-brand-100/60 border border-brand-200/50 text-[#0C447C] font-bold">
                    {{ customer.bookingsCount }} {{ customer.bookingsCount === 1 ? (localeStore.locale === 'ka' ? 'ვიზიტი' : 'visit') : (localeStore.locale === 'ka' ? 'ვიზიტი' : 'visits') }}
                  </span>
                </td>

                <!-- Lifetime Value (LTV) -->
                <td class="py-4 px-6">
                  <span class="font-extrabold text-brand-400 text-sm">
                    {{ localeStore.formatPrice(customer.lifetimeValue) }}
                  </span>
                </td>

                <!-- View history & Block buttons -->
                <td class="py-4 px-6 text-right">
                  <div class="flex justify-end items-center gap-2">
                    <button 
                      @click="viewHistory(customer)"
                      class="px-3.5 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500 bg-brand-100/40 hover:bg-brand-500 text-brand-600 hover:text-white font-bold transition duration-200 text-[10px] uppercase tracking-wider"
                    >
                      {{ localeStore.locale === 'ka' ? 'ისტორია' : 'History' }}
                    </button>
                    <button 
                      @click="toggleBlock(customer)"
                      class="px-3.5 py-1.5 rounded-lg font-bold transition duration-200 text-[10px] uppercase tracking-wider border"
                      :class="[
                        customer.isBlocked 
                          ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-500/20' 
                          : 'bg-rose-50/70 hover:bg-rose-500 text-rose-600 hover:text-white border-rose-500/20'
                      ]"
                    >
                      {{ customer.isBlocked ? localeStore.t('unblock') : localeStore.t('block') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Booking History Modal -->
      <div 
        v-if="selectedCustomer" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm transition duration-300"
        @click.self="closeHistory"
      >
        <div class="glass-panel max-w-2xl w-full rounded-2xl border border-brand-200 shadow-glass overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-100/30">
            <div>
              <h4 class="text-lg font-black text-[#0C447C] uppercase tracking-wider">{{ localeStore.t('history_modal_title') }}</h4>
              <p class="text-xs text-brand-500 mt-1">{{ selectedCustomer.name }} ({{ selectedCustomer.phoneNumber }})</p>
            </div>
            <button 
              @click="closeHistory" 
              class="h-8 w-8 rounded-lg bg-brand-100/40 hover:bg-brand-200/40 text-brand-500 hover:text-brand-700 flex items-center justify-center transition border border-brand-100"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body (Visits List) -->
          <div class="p-6 overflow-y-auto space-y-4 flex-grow">
            <div v-if="selectedCustomer.history.length === 0" class="text-center py-10 text-brand-400">
              {{ localeStore.t('history_empty') }}
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="booking in selectedCustomer.history" 
                :key="booking.id"
                class="p-4 rounded-xl border border-brand-100 bg-brand-100/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-brand-500 uppercase tracking-widest">ID:</span>
                    <span class="text-xs font-extrabold text-brand-400 tracking-wider">{{ booking.bookingId }}</span>

                  </div>
                  <div class="text-[10px] text-brand-400 font-semibold uppercase flex items-center gap-2 mt-0.5">
                    <span>📅 {{ formatDate(booking.startTime) }}</span>
                    <span v-if="booking.branch" class="text-brand-400/80">|</span>
                    <span v-if="booking.branch" class="text-brand-400/90 font-bold tracking-normal normal-case">🏢 {{ typeof booking.branch === 'object' ? localeStore.t(booking.branch?.name) : localeStore.t(booking.branch) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between sm:justify-end gap-4">
                  <span class="font-extrabold text-[#0C447C]">{{ localeStore.formatPrice(booking.totalPrice) }}</span>
                  
                  <!-- Status Chips -->
                  <div class="flex gap-2">
                    <!-- Booking Status -->
                    <span 
                      class="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border inline-block"
                      :class="[
                        booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' :
                        booking.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' :
                        booking.status === 'cancelled' ? 'bg-rose-50/70 text-rose-450 border-rose-450/20' :
                        'bg-brand-100 text-brand-500 border-brand-300/40/50'
                      ]"
                    >
                      {{ localeStore.t(booking.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-6 border-t border-brand-100 bg-brand-100/30 text-right">
            <button 
              @click="closeHistory" 
              class="px-5 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-bold uppercase tracking-wider bg-brand-100/10"
            >
              {{ localeStore.t('close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useAuthStore } from '~/stores/authStore'

const adminStore = useAdminStore()
const localeStore = useLocaleStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const selectedCustomer = ref(null)
const successMessage = ref('')
const errorMessage = ref('')

definePageMeta({
  layout: false
})

onMounted(async () => {
  localeStore.initialize()
  authStore.initialize()
  await adminStore.fetchDashboardData()
})

const filteredCustomers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return adminStore.crm

  return adminStore.crm.filter(c => {
    const nameMatch = c.name.toLowerCase().includes(query)
    const phoneMatch = c.phoneNumber.includes(query)
    return nameMatch || phoneMatch
  })
})

function viewHistory(customer) {
  selectedCustomer.value = customer
}

function closeHistory() {
  selectedCustomer.value = null
}

async function toggleBlock(customer) {
  const isBlocked = !customer.isBlocked
  const confirmMsg = isBlocked 
    ? localeStore.t('block_customer_confirm') 
    : localeStore.t('unblock_customer_confirm')

  if (window.confirm(confirmMsg)) {
    successMessage.value = ''
    errorMessage.value = ''
    const res = await adminStore.toggleBlockCustomer(customer.id, isBlocked)
    if (res.success) {
      successMessage.value = isBlocked 
        ? localeStore.t('customer_blocked_success') 
        : localeStore.t('customer_unblocked_success')
      setTimeout(() => {
        successMessage.value = ''
      }, 4000)
    } else {
      errorMessage.value = res.error || localeStore.t('operation_failed')
      setTimeout(() => {
        errorMessage.value = ''
      }, 4000)
    }
  }
}

function formatRegDate(isoString) {
  if (!isoString) return 'Seed Customer'
  const date = new Date(isoString)
  return date.toLocaleDateString(localeStore.locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const monthsKa = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"]
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const months = localeStore.locale === 'ka' ? monthsKa : monthsEn
  const monthStr = months[date.getUTCMonth()]
  const dayStr = date.getUTCDate()
  return `${monthStr} ${dayStr} @ ${hour}:${min}`
}
</script>
