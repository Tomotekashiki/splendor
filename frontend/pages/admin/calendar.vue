<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input 
            type="date" 
            v-model="selectedDateStr"
            class="glass-input px-4 py-2.5 rounded-xl font-bold text-xs text-[#0C447C]"
          />
          
          <!-- Branch Dropdown -->
          <div class="relative min-w-[200px]">
            <select 
              v-model="selectedBranchId"
              class="glass-input w-full p-2.5 pr-8 rounded-xl text-xs appearance-none cursor-pointer font-bold text-[#0C447C]"
            >
              <option v-for="br in bookingStore.branches" :key="br.id" :value="br.id">
                📍 {{ br.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#0C447C]">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <span class="text-xs text-brand-500 font-bold uppercase tracking-wider whitespace-nowrap">
            {{ localeStore.t('viewing_bookings') }}
          </span>
        </div>

        <button 
          @click="openManualForm"
          class="bg-brand-500 text-white flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
        >
          <span>➕</span>
          <span>{{ localeStore.t('manual_entry') }}</span>
        </button>
      </div>

      <div 
        v-if="adminStore.error" 
        class="px-4 py-3.5 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs font-semibold"
      >
        ⚠️ {{ adminStore.error }}
      </div>

      <!-- Live Notification Banner -->
      <div v-if="alertMessage" class="p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs flex justify-between items-center animate-pulse">
        <span>⚠️ {{ alertMessage }}</span>
        <button @click="alertMessage = null" class="text-rose-400 font-bold text-sm">✕</button>
      </div>

      <!-- Scheduler Container -->
      <div class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden flex flex-col min-h-[400px]">
        
        <!-- Skeleton Loader state -->
        <div v-if="isLoading" class="relative overflow-x-auto pr-1 pb-4">
          <div class="inline-block min-w-full">
            <!-- Headers skeleton -->
            <div class="grid gap-1 mb-2 bg-[#F8FAFC]/50 p-1 rounded-xl" :style="{ gridTemplateColumns: '100px repeat(3, 285px)', width: 'max-content' }">
              <div class="text-center text-[10px] font-bold text-brand-300 uppercase tracking-widest self-center animate-pulse">
                {{ localeStore.t('time_slot') }}
              </div>
              <div v-for="n in 3" :key="n" class="py-2.5 rounded-xl border border-slate-100 bg-slate-100/60 animate-pulse w-[285px] h-[34px] flex items-center justify-center">
                <div class="w-16 h-3 bg-slate-200/80 rounded-md"></div>
              </div>
            </div>

            <!-- Body skeleton -->
            <div class="grid relative bg-transparent rounded-xl border border-brand-100/50" :style="{ gridTemplateColumns: '100px repeat(3, 285px)', width: 'max-content' }">
              <template v-for="row in 6" :key="row">
                <!-- Time stamp placeholder -->
                <div class="text-[10px] font-semibold text-brand-300 h-20 flex items-center justify-center border-r border-b border-brand-100 bg-[#F8FAFC]/50 animate-pulse">
                  --:--
                </div>
                <!-- Bay slot placeholder -->
                <div v-for="col in 3" :key="col" class="h-20 border-b border-r border-brand-100/50 relative p-2">
                  <div v-if="row === 2 && col === 1" class="w-full h-16 rounded-xl bg-slate-100/80 border border-slate-200/40 animate-pulse p-2 flex flex-col justify-between">
                    <div class="w-1/2 h-2 bg-slate-200/80 rounded"></div>
                    <div class="w-2/3 h-2 bg-slate-200/50 rounded"></div>
                  </div>
                  <div v-else-if="row === 4 && col === 3" class="w-full h-16 rounded-xl bg-slate-100/80 border border-slate-200/40 animate-pulse p-2 flex flex-col justify-between">
                    <div class="w-1/3 h-2 bg-slate-200/80 rounded"></div>
                    <div class="w-1/2 h-2 bg-slate-200/50 rounded"></div>
                  </div>
                </div>
              </template>

              <!-- Central Spinner Loader overlay -->
              <div class="absolute inset-0 bg-[#F8FAFC]/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3">
                <div class="inline-block animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full shadow-sm"></div>
                <span class="text-[9px] text-[#0C447C] font-black uppercase tracking-widest animate-pulse">
                  {{ localeStore.locale === 'ka' ? 'კალენდარი სინქრონიზდება...' : 'Syncing calendar...' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrollable Scheduler Area -->
        <div v-else class="relative overflow-x-auto max-h-[640px] pr-1 pb-4">
          <div class="inline-block min-w-full">
            
            <!-- Legend / Bays Headers -->
            <div class="grid gap-1 mb-2 bg-[#F8FAFC]/50 p-1 rounded-xl" :style="{ gridTemplateColumns: `100px repeat(${filteredBays.length}, 285px)`, width: 'max-content' }">
              <!-- Time label corner -->
              <div class="text-center text-[10px] font-bold text-brand-400 uppercase tracking-widest self-center">
                {{ localeStore.t('time_slot') }}
              </div>
              <!-- Washing Bays Columns headers -->
              <div 
                v-for="(bay, idx) in filteredBays" 
                :key="bay.id"
                class="text-center py-2.5 rounded-xl font-black text-xs uppercase tracking-wider"
                :class="[
                  idx % 3 === 0 ? 'bg-brand-500/10 text-[#2B8FD4] border border-brand-500/20' :
                  idx % 3 === 1 ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                  'bg-teal-500/10 text-teal-600 border border-teal-500/20'
                ]"
              >
                🧼 {{ localeStore.t(bay.name) }}
              </div>
            </div>

            <!-- Grid tracks body -->
            <div class="grid relative bg-transparent rounded-xl border border-brand-100" :style="{ gridTemplateColumns: `100px repeat(${filteredBays.length}, 285px)`, width: 'max-content' }">
              <!-- Render Row Grid Marks -->
              <template v-for="(timeSlot, slotIdx) in gridTimeSlots" :key="timeSlot.iso">
                <!-- Left Time Stamp Column -->
                <div class="text-[10px] font-semibold text-brand-400 h-20 flex items-center justify-center border-r border-b border-brand-100 bg-[#F8FAFC]">
                  {{ formatSlotTimeOnly(timeSlot.iso) }}
                </div>

                <!-- Bay Droppable Slots Cells -->
                <div 
                  v-for="(bay, idx) in filteredBays" 
                  :key="bay.id"
                  class="h-20 border-b border-r border-brand-100 relative hover:bg-brand-100/40 transition-colors"
                  @dragover.prevent="onDragOverCell($event, bay.id, timeSlot.iso)"
                  @drop="onDropOnCell($event, bay.id, timeSlot.iso)"
                >
                  <!-- Ghost Slot Hovering Guide -->
                  <div v-if="dragOverBayId === bay.id && dragOverTimeStr === timeSlot.iso" class="absolute inset-1 rounded bg-brand-500/20 border border-dashed border-brand-500/50 flex items-center justify-center pointer-events-none">
                    <span class="text-[9px] text-brand-300 font-extrabold uppercase">Release to Schedule</span>
                  </div>
                </div>
              </template>

              <!-- Render Bookings Overlay absolute cards -->
              <div 
                v-for="booking in todayBookings" 
                :key="booking.id"
                class="absolute rounded-xl border p-2 text-xs flex flex-col justify-between cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl hover:scale-[1.01] transition-transform overflow-hidden backdrop-blur-sm"
                :class="getBookingCardColorClass(booking)"
                :style="computeBookingCardStyle(booking)"
                draggable="true"
                @dragstart="onDragStartBooking($event, booking.id)"
                :title="getBranchName(booking) ? localeStore.t('branch') + ': ' + getBranchName(booking) + (booking.notes ? '\n' + localeStore.t('note') + ': ' + booking.notes : '') : (booking.notes ? localeStore.t('note') + ': ' + booking.notes : '')"
              >
                <!-- Card Content -->
                <div class="flex flex-col justify-between h-full min-w-0">
                  <!-- Row 1: Name and Phone -->
                  <div class="flex items-center justify-between gap-x-2 border-b border-brand-100/30 pb-1 mb-1">
                    <span class="font-extrabold text-[10px] text-[#0C447C] truncate max-w-[60%]">
                      {{ booking.customer?.name }}
                    </span>
                    <span class="text-[9px] text-brand-500 font-bold font-mono whitespace-nowrap">
                      {{ booking.customer?.phoneNumber }}
                    </span>
                  </div>
                  
                  <!-- Row 2: Vehicle/Services and Status Badge -->
                  <div class="flex items-center justify-between gap-x-2">
                    <span class="text-[9px] text-[#0C447C]/80 font-semibold truncate max-w-[70%]">
                      🚗 {{ localeStore.t(booking.vehicleType?.name) }} - {{ booking.bookingServices.map(s => localeStore.t(s.service.name)).join(', ') }}
                    </span>
                    
                    <!-- Static Status Badge -->
                    <span 
                      class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 border"
                      :class="[
                        booking.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        booking.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        booking.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        'bg-rose-50 border-rose-200 text-rose-800'
                      ]"
                    >
                      {{ localeStore.t(booking.status === 'completed' ? 'completed_status' : booking.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Entry Overlay Modal -->
    <div v-if="showManualModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm">
      <div class="glass-panel max-w-lg w-full rounded-2xl p-6 shadow-glass relative space-y-4">
        <div class="flex justify-between items-center border-b border-brand-100 pb-3">
          <div>
            <h4 class="font-bold text-[#0C447C] text-lg">➕ {{ localeStore.t('manual_entry') }}</h4>
            <p class="text-[10px] text-brand-500 font-semibold tracking-wider uppercase mt-0.5">Admin bypass configuration</p>
          </div>
          <button @click="showManualModal = false" class="text-brand-500 hover:text-brand-700 text-lg">✕</button>
        </div>

        <div v-if="modalError" class="p-3 rounded-lg bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs">
          ⚠️ {{ modalError }}
        </div>

        <!-- Form fields -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Client name -->
          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('fullname') }}</label>
            <input 
              type="text" 
              placeholder="Name Surname"
              v-model="manualForm.name"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
          </div>

          <!-- Phone -->
          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('phone_number') }}</label>
            <input 
              type="text" 
              placeholder="+9955xxxxxx"
              v-model="manualForm.phoneNumber"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
          </div>


          <!-- Vehicle Type -->
          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('step_vehicle') }}</label>
            <div class="relative">
              <select 
                v-model="manualForm.vehicleTypeId"
                @change="onManualVehicleChange"
                class="glass-input w-full p-2.5 pr-8 rounded-lg text-xs appearance-none cursor-pointer"
              >
                <option v-for="vt in bookingStore.vehicleTypes" :key="vt.id" :value="vt.id">
                  {{ localeStore.t(vt.name) }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#0C447C]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Services packages checklists -->
          <div class="space-y-1.5 col-span-2">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('step_services') }}</label>
            <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-brand-100/40 p-2.5 rounded-lg border border-brand-100">
              <label 
                v-for="s in bookingStore.services" 
                :key="s.id" 
                class="flex items-center gap-2 text-[10px] text-brand-600 font-bold select-none cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  :value="s.id" 
                  v-model="manualForm.serviceIds" 
                  class="rounded bg-white border-brand-200 text-brand-500 focus:ring-0"
                />
                <span>{{ localeStore.t(s.name) }}</span>
              </label>
            </div>
          </div>

          <!-- Bay select -->
          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('bays_assigned') }}</label>
            <div class="relative">
              <select 
                v-model="manualForm.washingBayId"
                class="glass-input w-full p-2.5 pr-8 rounded-lg text-xs appearance-none cursor-pointer"
              >
                <option v-for="bay in filteredBays" :key="bay.id" :value="bay.id">
                  {{ localeStore.t(bay.name) }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#0C447C]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Time slot select -->
          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('time_slot') }}</label>
            <input 
              type="datetime-local" 
              v-model="manualForm.startTimeStr"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-brand-100">
          <button 
            @click="showManualModal = false"
            class="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-semibold"
          >
            {{ localeStore.t('cancel') }}
          </button>
          <button 
            @click="submitManualBooking"
            class="bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
          >
            {{ localeStore.t('confirm_and_book') }}
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useSettingsStore } from '~/stores/settingsStore'

const adminStore = useAdminStore()
const bookingStore = useBookingStore()
const localeStore = useLocaleStore()
const settingsStore = useSettingsStore()

const selectedDateStr = ref(new Date().toISOString().split('T')[0])
const selectedBranchId = ref("")
const alertMessage = ref(null)

const isLoading = computed(() => {
  return adminStore.loading || bookingStore.branches.length === 0 || filteredBays.value.length === 0
})

// Drag and drop states
const dragOverBayId = ref(null)
const dragOverTimeStr = ref(null)

// Manual Entry states
const showManualModal = ref(false)
const modalError = ref(null)
const manualForm = ref({
  name: '',
  phoneNumber: '',
  vehicleTypeId: '',
  serviceIds: [],
  washingBayId: '',
  startTimeStr: ''
})

definePageMeta({
  layout: false
})

const filteredBays = computed(() => {
  const bays = bookingStore.washingBays.filter(b => b.branchId === selectedBranchId.value)
  return [...bays].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
})

watch(() => bookingStore.branches, (newBranches) => {
  if (newBranches.length > 0 && !selectedBranchId.value) {
    selectedBranchId.value = newBranches[0].id
  }
}, { immediate: true })

const getBayColSpanClass = (idx) => {
  const count = filteredBays.value.length
  if (count <= 1) return 'col-span-10'
  if (count === 2) return 'col-span-5'
  if (count === 3) {
    return idx === 2 ? 'col-span-4' : 'col-span-3'
  }
  const base = Math.floor(10 / count)
  if (idx === count - 1) {
    return `col-span-${10 - (base * (count - 1))}`
  }
  return `col-span-${base}`
}

function getBranchName(booking) {
  if (!booking.branch) return ''
  return localeStore.t(typeof booking.branch === 'object' ? booking.branch?.name : booking.branch)
}

onMounted(async () => {
  localeStore.initialize()
  await adminStore.fetchDashboardData()
  await bookingStore.loadServiceGrid()
  await settingsStore.fetchSettings()
  if (bookingStore.branches.length > 0) {
    selectedBranchId.value = bookingStore.branches[0].id
  }
})

const activeHours = computed(() => {
  const branchHours = settingsStore.branchConfiguredHours[selectedBranchId.value]
  const hoursSource = (branchHours && branchHours.length > 0)
    ? branchHours
    : (settingsStore.configuredHours.length > 0 
        ? settingsStore.configuredHours 
        : ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"])

  return [...hoursSource].sort((a, b) => {
    const [hA, mA] = a.split(":").map(Number);
    const [hB, mB] = b.split(":").map(Number);
    return hA !== hB ? hA - hB : mA - mB;
  });
})

// Generate time slots dynamically based on settings
const gridTimeSlots = computed(() => {
  const date = selectedDateStr.value
  const slots = []
  
  for (const hStr of activeHours.value) {
    const [hour, min] = hStr.split(":").map(Number)
    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
    slots.push({
      iso: `${date}T${timeStr}Z`,
      hour,
      min
    })
  }
  return slots
})

// Filter bookings matching chosen date and branch
const todayBookings = computed(() => {
  return adminStore.bookings.filter(b => {
    if (b.status === 'cancelled') return false
    const datePart = new Date(b.startTime).toISOString().split('T')[0]
    
    // Filter by branch
    const bookingBranchId = b.branchId || (typeof b.branch === 'object' ? b.branch?.id : b.branch)
    const matchesBranch = bookingBranchId === selectedBranchId.value

    return datePart === selectedDateStr.value && matchesBranch
  })
})

function formatSlotTimeOnly(isoStr) {
  const date = new Date(isoStr)
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${min}`
}

/**
 * Computes where booking absolute cards sit on our scheduler columns and rows
 */
function computeBookingCardStyle(booking) {
  const bays = filteredBays.value
  const bayIndex = bays.findIndex(b => b.id === booking.washingBayId)
  if (bayIndex === -1) return { display: 'none' }

  const leftPosition = 100 + bayIndex * 285 + 8
  const widthVal = 285 - 16

  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)

  const startHour = String(start.getUTCHours()).padStart(2, '0')
  const startMin = String(start.getUTCMinutes()).padStart(2, '0')
  const startTimeStr = `${startHour}:${startMin}`

  const endHour = String(end.getUTCHours()).padStart(2, '0')
  const endMin = String(end.getUTCMinutes()).padStart(2, '0')
  const endTimeStr = `${endHour}:${endMin}`

  const sortedHours = activeHours.value
  const startIndex = sortedHours.indexOf(startTimeStr)
  const endIndex = sortedHours.indexOf(endTimeStr)

  let topOffsetPx = 4
  let heightPx = 72

  const durationMin = (end.getTime() - start.getTime()) / (60 * 1000)

  if (startIndex !== -1) {
    topOffsetPx = startIndex * 80 + 4
    if (endIndex !== -1 && endIndex > startIndex) {
      const slotsSpanned = endIndex - startIndex
      heightPx = slotsSpanned * 80 - 8
    } else {
      const slotsSpanned = Math.round(durationMin / 30)
      heightPx = slotsSpanned * 80 - 8
    }
  } else {
    // Fallback if booking starts outside visible hours, map to closest slot
    const [bH, bM] = startTimeStr.split(":").map(Number)
    let closestIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < sortedHours.length; i++) {
      const [sH, sM] = sortedHours[i].split(":").map(Number)
      const diff = Math.abs((sH * 60 + sM) - (bH * 60 + bM))
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    topOffsetPx = closestIndex * 80 + 4
    const slotsSpanned = Math.round(durationMin / 30)
    heightPx = slotsSpanned * 80 - 8
  }

  // CLAMP HEIGHT to prevent overflowing below the last visible time slot
  const maxBottom = sortedHours.length * 80 - 4
  if (topOffsetPx + heightPx > maxBottom) {
    heightPx = Math.max(72, maxBottom - topOffsetPx)
  }

  return {
    left: `${leftPosition}px`,
    width: `${widthVal}px`,
    top: `${topOffsetPx}px`,
    height: `${heightPx}px`,
    'z-index': 10
  }
}

function getBookingCardColorClass(booking) {
  const bays = filteredBays.value
  const bayIndex = bays.findIndex(b => b.id === booking.washingBayId)
  if (bayIndex === -1) return ''
  
  const idx = bayIndex % 3
  if (idx === 0) return 'bg-[#2B8FD4]/12 border-[#2B8FD4]/40 text-[#0C447C] shadow-brand-500/5'
  if (idx === 1) return 'bg-purple-500/12 border-purple-500/40 text-purple-950 shadow-purple-500/5'
  return 'bg-teal-500/12 border-teal-500/40 text-teal-950 shadow-teal-500/5'
}

function checkBookingOverlap(bookingId, targetBayId, targetStartTimeIso, durationMinutes) {
  const targetStart = new Date(targetStartTimeIso).getTime();
  const targetEnd = targetStart + durationMinutes * 60 * 1000;

  return adminStore.bookings.some(b => {
    if (b.id === bookingId) return false;
    if (b.status === 'cancelled') return false;
    if (b.washingBayId !== targetBayId) return false;

    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();

    // Check overlap: targetStart < bEnd && bStart < targetEnd
    return targetStart < bEnd && bStart < targetEnd;
  });
}

function checkBookingFitsHours(targetStartTimeIso, durationMinutes) {
  const start = new Date(targetStartTimeIso);
  const hourStr = String(start.getUTCHours()).padStart(2, '0');
  const minStr = String(start.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hourStr}:${minStr}`;

  return activeHours.value.includes(timeStr);
}


// DRAG AND DROP HANDLERS
function onDragStartBooking(event, bookingId) {
  event.dataTransfer.setData('text/plain', bookingId)
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOverCell(event, bayId, timeIsoStr) {
  dragOverBayId.value = bayId
  dragOverTimeStr.value = timeIsoStr
}

async function onDropOnCell(event, bayId, timeIsoStr) {
  const bookingId = event.dataTransfer.getData('text/plain')
  dragOverBayId.value = null
  dragOverTimeStr.value = null

  if (!bookingId) return

  alertMessage.value = null

  const booking = adminStore.bookings.find(b => b.id === bookingId)
  if (!booking) return

  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000))

  if (!checkBookingFitsHours(timeIsoStr, durationMinutes)) {
    alertMessage.value = localeStore.t('slot_outside_hours')
    return
  }

  if (checkBookingOverlap(bookingId, bayId, timeIsoStr, durationMinutes)) {
    alertMessage.value = localeStore.t('slot_occupied')
    return
  }

  const result = await adminStore.moveBooking(bookingId, bayId, timeIsoStr)
  if (!result.success) {
    alertMessage.value = result.error
  }
}

// STATUS CHANGED
async function onStatusChanged(bookingId, newStatus) {
  await adminStore.updateStatus(bookingId, { status: newStatus })
}

// MANUAL FORM HANDLERS
function openManualForm() {
  modalError.value = null
  manualForm.value = {
    name: '',
    phoneNumber: '',
    vehicleTypeId: bookingStore.vehicleTypes[0]?.id || '',
    serviceIds: [],
    washingBayId: filteredBays.value[0]?.id || '',
    startTimeStr: `${selectedDateStr.value}T10:00`
  }
  showManualModal.value = true
}

function onManualVehicleChange() {
  manualForm.value.serviceIds = []
}

async function submitManualBooking() {
  modalError.value = null
  const input = manualForm.value

  if (!input.name || !input.phoneNumber || !input.startTimeStr || input.serviceIds.length === 0) {
    modalError.value = 'Please complete all form fields.'
    return
  }

  const payload = {
    name: input.name,
    phoneNumber: input.phoneNumber,
    vehicleTypeId: input.vehicleTypeId,
    serviceIds: input.serviceIds,
    startTime: new Date(input.startTimeStr).toISOString(),
    washingBayId: input.washingBayId,
    paymentMethod: 'on_site',
    branchId: selectedBranchId.value,
    isAdminEntry: true // Bypasses SMS verification checks
  }

  try {
    const config = useNuxtApp().$config || useRuntimeConfig()
    const response = await $fetch(`${config.public.apiBase}/bookings`, {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      showManualModal.value = false
      await adminStore.fetchDashboardData() // Reload calendar
    }
  } catch (err) {
    console.warn('Failed to insert manual booking via API, simulating local insertion:', err);
    
    const randomBookingId = "ANT-" + Math.floor(100000 + Math.random() * 900000);
    const selectedVT = bookingStore.vehicleTypes.find(v => v.id === input.vehicleTypeId);
    const selectedSvs = bookingStore.services.filter(s => input.serviceIds.includes(s.id));
    
    const matrixItems = bookingStore.serviceMatrix.filter(
      m => m.vehicleTypeId === input.vehicleTypeId && input.serviceIds.includes(m.serviceId)
    );
    const price = matrixItems.reduce((sum, m) => sum + parseFloat(m.price), 0).toFixed(2);
    const duration = matrixItems.reduce((sum, m) => sum + m.durationMinutes, 0);
    
    const startTimeDate = new Date(input.startTimeStr);
    const endTimeDate = new Date(startTimeDate.getTime() + duration * 60000);
    
    const mockBooking = {
      id: "mb-" + Math.random().toString(),
      bookingId: randomBookingId,
      customerId: "c-manual",
      washingBayId: input.washingBayId,
      vehicleTypeId: input.vehicleTypeId,
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
      totalPrice: price,
      paymentMethod: 'on_site',
      paymentStatus: 'unpaid',
      status: 'pending',
      branchId: selectedBranchId.value,
      branch: { id: selectedBranchId.value },
      customer: {
        name: input.name,
        phoneNumber: input.phoneNumber
      },
      vehicleType: {
        name: selectedVT?.name || "Vehicle"
      },
      bookingServices: selectedSvs.map(s => {
        const mat = matrixItems.find(m => m.serviceId === s.id);
        return {
          service: { name: s.name },
          price: mat?.price || "0.00",
          durationMinutes: mat?.durationMinutes || 30
        };
      })
    };
    
    adminStore.bookings.push(mockBooking);
    adminStore.recalculateStats();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('splendor_bookings', JSON.stringify(adminStore.bookings));
        window.dispatchEvent(new CustomEvent('splendor_new_booking', { detail: mockBooking }));
      } catch (e) {
        console.error("localStorage error:", e);
      }
    }
    showManualModal.value = false;
  }
}
</script>

<style scoped>
/* Injecting absolute layouts styling */
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
</style>
