<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div class="flex items-center gap-3">
          <input 
            type="date" 
            v-model="selectedDateStr"
            class="glass-input px-4 py-2.5 rounded-xl font-bold text-xs text-[#0C447C]"
          />
          <span class="text-xs text-brand-500 font-bold uppercase tracking-wider">
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
      <div class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden flex flex-col">
        
        <!-- Legend / Bays Headers -->
        <div class="grid grid-cols-12 gap-1 mb-2">
          <!-- Time label corner -->
          <div class="col-span-2 text-center text-[10px] font-bold text-brand-400 uppercase tracking-widest self-center">
            {{ localeStore.t('time_slot') }}
          </div>
          <!-- Washing Bays Columns headers -->
          <div 
            v-for="(bay, idx) in bookingStore.washingBays" 
            :key="bay.id"
            class="text-center py-2.5 rounded-xl font-black text-xs uppercase tracking-wider"
            :class="[
              idx === 0 ? 'col-span-3 bg-brand-500/10 text-[#2B8FD4] border border-brand-500/20' :
              idx === 1 ? 'col-span-3 bg-purple-500/10 text-purple-600 border border-purple-500/20' :
              'col-span-4 bg-teal-500/10 text-teal-600 border border-teal-500/20'
            ]"
          >
            🧼 {{ localeStore.t(bay.name) }}
          </div>
        </div>

        <!-- Scrollable Scheduler Area -->
        <div class="relative overflow-x-auto max-h-[640px] pr-1">
          <div class="grid grid-cols-12 gap-y-1 relative bg-transparent rounded-xl" style="min-width: 600px;">
            <!-- Render Row Grid Marks -->
            <template v-for="(timeSlot, slotIdx) in gridTimeSlots" :key="timeSlot.iso">
              <!-- Left Time Stamp Column -->
              <div class="col-span-2 text-[10px] font-semibold text-brand-400 h-14 flex items-center justify-center border-r border-brand-100">
                {{ formatSlotTimeOnly(timeSlot.iso) }}
              </div>

              <!-- Bay Droppable Slots Cells -->
              <div 
                v-for="bay in bookingStore.washingBays" 
                :key="bay.id"
                class="col-span-3 h-14 border-b border-r border-brand-100 relative hover:bg-brand-100/40 transition-colors"
                :class="[bookingStore.washingBays.length === 3 ? 'col-span-3' : 'col-span-3']"
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
              class="absolute rounded-xl border p-2 text-xs flex flex-col justify-between cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl hover:scale-[1.01] transition-transform overflow-hidden"
              :style="computeBookingCardStyle(booking)"
              draggable="true"
              @dragstart="onDragStartBooking($event, booking.id)"
              :title="getBranchName(booking) ? localeStore.t('branch') + ': ' + getBranchName(booking) + (booking.notes ? '\n' + localeStore.t('note') + ': ' + booking.notes : '') : (booking.notes ? localeStore.t('note') + ': ' + booking.notes : '')"
            >
              <!-- Card Content -->
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="flex justify-between items-center">
                  <span class="font-extrabold text-[10px] text-[#0C447C] truncate max-w-[70%]">
                    {{ booking.customer?.name }}
                  </span>
                </div>
                <span class="text-[9px] text-[#0C447C]/80 font-semibold truncate">
                  🚗 {{ localeStore.t(booking.vehicleType?.name) }} - {{ booking.bookingServices.map(s => localeStore.t(s.service.name)).join(', ') }}
                </span>
              </div>

              <!-- Card Bottom Details -->
              <div class="flex justify-between items-center mt-1 border-t border-brand-100/30 pt-1">
                <span class="text-[9px] font-extrabold text-[#1A6FAB]">{{ localeStore.formatPrice(booking.totalPrice) }}</span>
                <div class="relative w-20">
                  <select 
                    :value="booking.status" 
                    @change="onStatusChanged(booking.id, $event.target.value)"
                    class="w-full bg-white/95 border border-brand-200 text-[9px] font-bold rounded pl-1.5 pr-4.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 text-[#0C447C] cursor-pointer appearance-none shadow-sm transition-all duration-200"
                  >
                    <option value="pending">{{ localeStore.t('pending') }}</option>
                    <option value="in_progress">{{ localeStore.t('in_progress') }}</option>
                    <option value="completed">{{ localeStore.t('completed_status') }}</option>
                    <option value="cancelled">{{ localeStore.t('cancelled') }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none text-brand-500">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
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
                <option v-for="bay in bookingStore.washingBays" :key="bay.id" :value="bay.id">
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
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useSettingsStore } from '~/stores/settingsStore'

const adminStore = useAdminStore()
const bookingStore = useBookingStore()
const localeStore = useLocaleStore()
const settingsStore = useSettingsStore()

const selectedDateStr = ref(new Date().toISOString().split('T')[0])
const alertMessage = ref(null)

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

function getBranchName(booking) {
  if (!booking.branch) return ''
  return localeStore.t(typeof booking.branch === 'object' ? booking.branch?.name : booking.branch)
}

onMounted(async () => {
  localeStore.initialize()
  await adminStore.fetchDashboardData()
  await bookingStore.loadServiceGrid()
  await settingsStore.fetchSettings()
})

const activeHours = computed(() => {
  const hoursSource = settingsStore.configuredHours.length > 0 
    ? settingsStore.configuredHours 
    : ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]

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

// Filter bookings matching chosen date
const todayBookings = computed(() => {
  return adminStore.bookings.filter(b => {
    if (b.status === 'cancelled') return false
    const datePart = new Date(b.startTime).toISOString().split('T')[0]
    return datePart === selectedDateStr.value
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
  const bays = bookingStore.washingBays
  const bayIndex = bays.findIndex(b => b.id === booking.washingBayId)
  if (bayIndex === -1) return { display: 'none' }

  // Columns settings
  // Column 1 is Time labels (span 2), each Box spans 3 (or 4 for Box 3)
  const leftPosition = 16.66 + bayIndex * 25.0 + 1.2 // Percent offset
  const widthVal = 23.0 // Width percent

  // Row heights settings
  // Position mapped to dynamic activeHours slots row index
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

  let topOffsetPx = 48
  let heightPx = 52

  const durationMin = (end.getTime() - start.getTime()) / (60 * 1000)

  if (startIndex !== -1) {
    topOffsetPx = startIndex * 56 + 48
    if (endIndex !== -1 && endIndex > startIndex) {
      const slotsSpanned = endIndex - startIndex
      heightPx = slotsSpanned * 56 - 4
    } else {
      const slotsSpanned = Math.round(durationMin / 30)
      heightPx = slotsSpanned * 56 - 4
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
    topOffsetPx = closestIndex * 56 + 48
    const slotsSpanned = Math.round(durationMin / 30)
    heightPx = slotsSpanned * 56 - 4
  }

  // Styling based on Column color templates
  let colors = 'bg-[#2B8FD4]/12 border-[#2B8FD4]/30 text-[#0C447C]'
  if (bayIndex === 1) colors = 'bg-purple-500/12 border-purple-500/30 text-purple-950'
  if (bayIndex === 2) colors = 'bg-teal-500/12 border-teal-500/30 text-teal-950'

  return {
    left: `${leftPosition}%`,
    width: `${widthVal}%`,
    top: `${topOffsetPx}px`,
    height: `${heightPx}px`,
    // Apply styling borders classes directly
    'z-index': 10
  }
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
    washingBayId: bookingStore.washingBays[0]?.id || '',
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
