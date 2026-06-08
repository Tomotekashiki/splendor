<template>
  <NuxtLayout name="admin">
    <!-- Restricted for Managers? No, both Admin and Manager can see CRM data -->
    <div class="space-y-6">
      <!-- Header Area -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-white uppercase tracking-wide">
            {{ localeStore.t('registered_customers') }}
          </h3>
          <p class="text-slate-400 text-xs mt-1">საიტზე რეგისტრირებული მომხმარებლების სია და მათი აქტივობა</p>
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
        class="px-4 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
      >
        {{ errorMessage }}
      </div>

      <!-- Filters & Search Bar -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="relative w-full sm:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
            🔍
          </span>
          <input 
            type="text" 
            :placeholder="localeStore.locale === 'ka' ? 'მოძებნეთ კლიენტის სახელი ან ტელეფონის ნომერი...' : 'Search customer name or phone...'"
            v-model="searchQuery"
            class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-xs transition duration-200"
          />
        </div>
        <div class="text-slate-400 text-xs font-bold uppercase shrink-0">
          ჯამში: <span class="text-brand-400 font-extrabold text-sm">{{ filteredCustomers.length }}</span> მომხმარებელი
        </div>
      </div>

      <!-- Loading / Empty / Data states -->
      <div v-if="adminStore.loading && adminStore.crm.length === 0" class="text-center py-16">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">მიმდინარეობს მონაცემების ჩატვირთვა...</p>
      </div>

      <div v-else-if="filteredCustomers.length === 0" class="text-center py-16 bg-slate-900/40 border border-white/5 rounded-2xl">
        <span class="text-3xl">👥</span>
        <p class="text-xs text-slate-400 font-bold mt-3">მომხმარებლები ვერ მოიძებნა.</p>
      </div>

      <!-- Customers Table -->
      <div v-else class="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-glass">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-slate-900/40 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <th class="py-4 px-6">კლიენტის დეტალები</th>
                <th class="py-4 px-6">რეგისტრაცია</th>
                <th class="py-4 px-6">ვიზიტები</th>
                <th class="py-4 px-6">ჯამური LTV</th>
                <th class="py-4 px-6 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-xs text-slate-300">
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
                        <span class="font-extrabold text-white text-sm">{{ customer.name }}</span>
                        <span 
                          v-if="customer.isBlocked"
                          class="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-450/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                        >
                          {{ localeStore.t('blocked') }}
                        </span>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium tracking-wide">{{ customer.phoneNumber }}</span>
                    </div>
                  </div>
                </td>


                <!-- Registration Date -->
                <td class="py-4 px-6 text-slate-400">
                  {{ formatRegDate(customer.createdAt) }}
                </td>

                <!-- Bookings count -->
                <td class="py-4 px-6">
                  <span class="px-2 py-0.5 rounded bg-slate-800 border border-white/5 text-white font-bold">
                    {{ customer.bookingsCount }} ვიზიტი
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
                      class="px-3.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white font-bold transition text-[10px] uppercase tracking-wider"
                    >
                      {{ localeStore.locale === 'ka' ? 'ისტორია' : 'History' }}
                    </button>
                    <button 
                      @click="toggleBlock(customer)"
                      class="px-3.5 py-1.5 rounded-lg font-bold transition text-[10px] uppercase tracking-wider border"
                      :class="[
                        customer.isBlocked 
                          ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/20' 
                          : 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border-rose-500/20'
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition duration-300"
        @click.self="closeHistory"
      >
        <div class="glass-panel max-w-2xl w-full rounded-2xl border border-white/10 shadow-glass overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
            <div>
              <h4 class="text-lg font-black text-white uppercase tracking-wider">ვიზიტების ისტორია</h4>
              <p class="text-xs text-slate-400 mt-1">{{ selectedCustomer.name }} ({{ selectedCustomer.phoneNumber }})</p>
            </div>
            <button 
              @click="closeHistory" 
              class="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition border border-white/5"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body (Visits List) -->
          <div class="p-6 overflow-y-auto space-y-4 flex-grow">
            <div v-if="selectedCustomer.history.length === 0" class="text-center py-10 text-slate-500">
              ვიზიტების ისტორია ცარიელია.
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="booking in selectedCustomer.history" 
                :key="booking.id"
                class="p-4 rounded-xl border border-white/5 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">ID:</span>
                    <span class="text-xs font-extrabold text-brand-400 tracking-wider">{{ booking.bookingId }}</span>

                  </div>
                  <div class="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-2 mt-0.5">
                    <span>📅 {{ formatDate(booking.startTime) }}</span>
                    <span v-if="booking.branch" class="text-slate-600">|</span>
                    <span v-if="booking.branch" class="text-brand-400/90 font-bold tracking-normal normal-case">🏢 {{ typeof booking.branch === 'object' ? localeStore.t(booking.branch?.name) : localeStore.t(booking.branch) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between sm:justify-end gap-4">
                  <span class="font-extrabold text-white">{{ localeStore.formatPrice(booking.totalPrice) }}</span>
                  
                  <!-- Status Chips -->
                  <div class="flex gap-2">
                    <!-- Booking Status -->
                    <span 
                      class="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border inline-block"
                      :class="[
                        booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' :
                        booking.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' :
                        booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-450 border-rose-450/20' :
                        'bg-slate-800 text-slate-400 border-slate-700/50'
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
          <div class="p-6 border-t border-white/5 bg-slate-900/40 text-right">
            <button 
              @click="closeHistory" 
              class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-white/5"
            >
              დახურვა
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
      errorMessage.value = res.error || (localeStore.locale === 'ka' ? 'მოქმედება ვერ შესრულდა' : 'Operation failed')
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
  return date.toLocaleDateString(localeStore.locale === 'ka' ? 'ka-GE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
</script>
