<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    <!-- Chat Frosted Glass Panel -->
    <transition name="chat-slide">
      <div 
        v-if="isOpen" 
        class="glass-panel w-96 h-[500px] mb-4 bg-white/95 backdrop-blur-md border border-brand-200/50 shadow-glass rounded-2xl flex flex-col overflow-hidden max-w-[calc(100vw-2rem)]"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#0C447C] to-[#2B8FD4] text-white p-4 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">
              🤖
            </div>
            <div>
              <h4 class="font-bold text-sm leading-none">SPLENDOR ასისტენტი</h4>
              <span class="text-[10px] text-white/80 font-medium">ონლაინ დაჯავშნა</span>
            </div>
          </div>
          <button 
            @click="toggleChat" 
            aria-label="ჩატის დახურვა"
            class="text-white/85 hover:text-white hover:scale-110 active:scale-95 transition text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg"
          >
            ✕
          </button>
        </div>

        <!-- Banner for notification settings if not granted -->
        <div 
          v-if="notificationStore.permissionStatus !== 'granted'" 
          class="bg-brand-50 border-b border-brand-100/50 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0"
        >
          <div class="flex items-center gap-2 text-brand-700">
            <span class="text-sm">🔔</span>
            <span class="text-[10px] font-bold leading-tight">{{ localeStore.t('enable_desktop_notifications') }}</span>
          </div>
          <button 
            @click="requestPermissionFromChat" 
            class="bg-brand-500 hover:bg-brand-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm transition duration-200"
          >
            {{ localeStore.locale === 'ka' ? 'ჩართვა' : 'Enable' }}
          </button>
        </div>

        <!-- Messages Area -->
        <div ref="messagesContainer" class="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/30">
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            class="flex flex-col"
          >
            <!-- Date/Time or Metadata Bubble -->
            <div v-if="msg.sender === 'system'" class="text-center my-1">
              <span class="bg-brand-100/60 text-brand-600 px-2.5 py-1 rounded-full text-[9px] font-bold">
                {{ msg.text }}
              </span>
            </div>

            <!-- Normal Chat Bubble -->
            <div 
              v-else 
              :class="[
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl rounded-tr-none ml-auto' 
                  : 'bg-white border border-brand-100 text-brand-700 rounded-2xl rounded-tl-none mr-auto shadow-sm',
                'p-3 max-w-[85%] text-xs font-medium leading-relaxed'
              ]"
            >
              <!-- Text -->
              <p class="whitespace-pre-line">{{ msg.text }}</p>

              <!-- Image (if present in custom push message) -->
              <div v-if="msg.image" class="mt-2.5 rounded-xl overflow-hidden max-w-full border border-brand-100/50 shadow-sm bg-slate-50">
                <img :src="msg.image" class="w-full h-auto object-cover max-h-[140px]" alt="Message Image" />
              </div>

              <!-- Interactive Slot Option - Branch -->
              <div v-if="msg.optionsType === 'branch' && !slots.branch" class="mt-3 flex flex-col gap-2">
                <button 
                  v-for="branch in bookingStore.branches" 
                  :key="branch.id"
                  @click="selectBranch(branch.id, branch.name?.ka || branch.name)"
                  class="bg-brand-50/50 hover:bg-brand-500 hover:text-white border border-brand-200/60 rounded-xl py-2 px-3 text-[10px] font-bold text-brand-600 text-left transition duration-200 hover:scale-[1.01]"
                >
                  📍 {{ branch.name?.ka || branch.name }}
                </button>
              </div>

              <!-- Interactive Slot Option - Car Type -->
              <div v-if="msg.optionsType === 'car_type' && !slots.car_type" class="mt-3 grid grid-cols-3 gap-2">
                <button 
                  v-for="type in carTypes" 
                  :key="type.id"
                  @click="selectCarType(type.id, type.label)"
                  class="bg-brand-50/50 hover:bg-brand-500 hover:text-white border border-brand-200/60 rounded-xl py-2 px-1 text-[10px] font-bold text-brand-600 text-center transition duration-200 hover:scale-[1.03]"
                >
                  🚗 {{ type.label }}
                </button>
              </div>

              <!-- Interactive Slot Option - Wash Package -->
              <div v-if="msg.optionsType === 'wash_package' && !slots.wash_package" class="mt-3 flex flex-col gap-2">
                <button 
                  v-for="pkg in washPackages" 
                  :key="pkg.id"
                  @click="selectWashPackage(pkg.id, pkg.label)"
                  class="bg-brand-50/50 hover:bg-brand-500 hover:text-white border border-brand-200/60 rounded-xl py-2.5 px-3 text-[10px] font-bold text-brand-600 text-left transition duration-200 hover:scale-[1.01] flex justify-between items-center"
                >
                  <span>🧼 {{ pkg.label }}</span>
                  <span class="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-md font-extrabold group-hover:bg-brand-600 group-hover:text-white">
                    {{ pkg.price }}
                  </span>
                </button>
              </div>

              <!-- Interactive Slot Option - Available Time Slots -->
              <div v-if="msg.optionsType === 'time_slots' && msg.availableSlots && msg.availableSlots.length > 0 && !slots.datetime" class="mt-3 grid grid-cols-3 gap-2">
                <button 
                  v-for="slot in msg.availableSlots" 
                  :key="slot"
                  @click="selectTimeSlot(slot)"
                  class="bg-brand-50/50 hover:bg-brand-500 hover:text-white border border-brand-200/60 rounded-xl py-2 px-1 text-[10px] font-bold text-brand-600 text-center transition duration-200 hover:scale-[1.03]"
                >
                  🕐 {{ formatTimeOnly(slot) }}
                </button>
              </div>

              <!-- Interactive Slot Option - Final Confirmation -->
              <div v-if="msg.optionsType === 'confirmation' && chatStep === 'confirming'" class="mt-3 flex flex-col gap-2">
                <template v-if="customerAuth.isAuthenticated">
                  <div class="flex gap-2 w-full">
                    <button 
                      @click="confirmBooking"
                      :disabled="loading"
                      class="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 px-4 text-xs font-bold transition duration-200 hover:scale-[1.03] flex-1 flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      <span v-if="loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span v-else>✅ კი</span>
                    </button>
                    <button 
                      @click="rejectBooking"
                      :disabled="loading"
                      class="border border-rose-300 hover:bg-rose-50 text-rose-600 rounded-xl py-2 px-4 text-xs font-bold transition duration-200 hover:scale-[1.03] flex-1 text-center disabled:opacity-50"
                    >
                      ❌ არა
                    </button>
                  </div>
                </template>
                <template v-else>
                  <button 
                    @click="triggerSignIn"
                    class="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition duration-200 hover:scale-[1.02] active:scale-[0.98] w-full flex items-center justify-center gap-1.5 shadow-md"
                  >
                    🔑 შესვლა დასაჯავშნად
                  </button>
                  <button 
                    @click="rejectBooking"
                    class="border border-brand-200 hover:bg-slate-50 text-brand-500 rounded-xl py-2 px-4 text-[11px] font-bold transition duration-200 w-full text-center"
                  >
                    ❌ გაუქმება
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <form @submit.prevent="sendMessage" class="border-t border-brand-100/60 p-3 bg-white flex gap-2 items-center shrink-0">
          <input 
            type="text" 
            v-model="inputVal"
            placeholder="ჩაწერეთ შეტყობინება..." 
            :disabled="chatStep === 'success' || loading"
            class="flex-grow glass-input px-4 py-2.5 rounded-xl text-xs placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button 
            type="submit" 
            :disabled="!inputVal.trim() || chatStep === 'success' || loading"
            aria-label="შეტყობინების გაგზავნა"
            class="bg-brand-500 hover:bg-brand-600 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition duration-200 flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px]"
          >
            <svg class="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </transition>

    <!-- Floating Toggle Button -->
    <button 
      @click="toggleChat"
      :aria-label="isOpen ? 'ჩატის დახურვა' : 'ონლაინ ასისტენტის გახსნა'"
      aria-haspopup="dialog"
      class="bg-gradient-to-tr from-brand-500 to-brand-700 text-white rounded-full p-4 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center select-none relative group min-w-[56px] min-h-[56px]"
    >
      <div v-if="!isOpen" class="flex items-center justify-center w-6 h-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div v-else class="flex items-center justify-center w-6 h-6 text-lg font-bold">
        ✕
      </div>
      
      <!-- Bouncy Notification Badge -->
      <span 
        v-if="!isOpen && unreadCount > 0" 
        class="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-bounce shadow-md border-2 border-white"
      >
        {{ unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useNotificationStore } from '~/stores/notificationStore'

const bookingStore = useBookingStore()
const customerAuth = useCustomerAuthStore()
const localeStore = useLocaleStore()
const notificationStore = useNotificationStore()

function triggerSignIn() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('splendor:open-auth'))
  }
}

function requestPermissionFromChat() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "denied") {
      const title = localeStore.locale === 'ka' ? 'ნოტიფიკაციები დაბლოკილია' : 'Notifications Blocked'
      const body = localeStore.locale === 'ka'
        ? 'გთხოვთ დააწკაპუნოთ ბრაუზერის მისამართების ზოლში ბოქლომის ხატულას და ჩართოთ ნოტიფიკაციები (Notifications).'
        : 'Please click the lock icon in your browser address bar and enable Notifications.'
      notificationStore.addToast('warning', title, body)
    } else {
      notificationStore.requestDesktopPermission().catch(e => console.warn(e))
    }
  }
}

const isOpen = ref(false)
const unreadCount = ref(0)
const inputVal = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

const messages = ref([
  {
    id: 1,
    sender: 'assistant',
    text: 'გამარჯობა, მე SPLENDOR-ის ასისტენტი ვარ. რით შემიძლია დაგეხმაროთ?'
  }
])

// Conversational booking parameters
const slots = ref({
  branch: null,         // Branch ID (e.g. 'br-saburtalo', 'br-vake')
  car_type: null,       // 'v-sedan' | 'v-suv' | 'v-minivan'
  wash_package: null,   // 's-standard' | 's-premium'
  date: null,           // 'YYYY-MM-DD'
  time: null,           // 'HH:mm'
  datetime: null,       // ISO datetime string
  license_plate: null   // License plate number string
})

const chatStep = ref('greeting') // 'greeting' | 'collecting' | 'confirming' | 'success'

// Mappings for slots
const carTypes = [
  { id: 'v-sedan', label: 'სედანი' },
  { id: 'v-suv', label: 'ჯიპი/SUV' },
  { id: 'v-minivan', label: 'მინივენი' }
]

const washPackages = [
  { id: 's-standard', label: 'სტანდარტული რეცხვა', price: '20-35 ₾' },
  { id: 's-premium', label: 'პრემიუმ რეცხვა', price: '35-50 ₾' }
]

const vehicleTypeNames = {
  'v-sedan': 'სედანი',
  'v-suv': 'ჯიპი/SUV',
  'v-minivan': 'მინივენი'
}

const packageNames = {
  's-standard': 'სტანდარტული რეცხვა',
  's-premium': 'პრემიუმ რეცხვა'
}

// Maps raw Wit.ai strings to internal IDs
const branchMap = {
  'saburtalo': 'br-saburtalo',
  'საბურთალო': 'br-saburtalo',
  'საბურთალოს': 'br-saburtalo',
  'vake': 'br-vake',
  'ვაკე': 'br-vake',
  'ვაკის': 'br-vake',
  'gldani': 'br-gldani',
  'გლდანი': 'br-gldani',
  'გლდანის': 'br-gldani'
}

const carTypeMap = {
  'sedan': 'v-sedan',
  'სედანი': 'v-sedan',
  'suv': 'v-suv',
  'jeep': 'v-suv',
  'ჯიპი': 'v-suv',
  'სუვი': 'v-suv',
  'minivan': 'v-minivan',
  'მინივენი': 'v-minivan'
}

const packageMap = {
  'standard': 's-standard',
  'სტანდარტული': 's-standard',
  'სტანდარტი': 's-standard',
  'premium': 's-premium',
  'complex': 's-premium',
  'კომპლექსური': 's-premium',
  'პრემიუმ': 's-premium'
}

let handlePushEvent = null

onMounted(() => {
  // Load initial store definitions
  bookingStore.loadServiceGrid()

  if (typeof window !== 'undefined') {
    handlePushEvent = (e) => {
      const { title, body, image, data } = e.detail || {}
      
      // Filter out admin-targeted notifications from the customer chat widget
      if (data?.target === 'admin') return
      if (title && (title.includes('ახალი ჯავშანი') || title.includes('New Booking') || title.startsWith('ჯავშანი განახლდა:'))) {
        return
      }

      // Add push notification directly to chat messages
      messages.value.push({
        id: Date.now() + Math.random(),
        sender: 'assistant',
        text: `📢 ${title}\n\n${body}`,
        image: image
      })

      // If chat is not open, highlight with bouncy unread badge
      if (!isOpen.value) {
        unreadCount.value++
      }
      
      scrollToBottom()
    }
    window.addEventListener('splendor:push-received', handlePushEvent)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && handlePushEvent) {
    window.removeEventListener('splendor:push-received', handlePushEvent)
  }
})

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (!isOpen.value) return
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

// Watch messages length to auto scroll only when chat is open
watch(messages, () => {
  if (isOpen.value) {
    scrollToBottom()
  }
}, { deep: true })

async function sendMessage() {
  const text = inputVal.value.trim()
  if (!text) return

  // 1. Add user message to UI
  addMessage('user', text)
  inputVal.value = ''
  
  if (chatStep.value === 'success') return

  // If we are specifically waiting for the license plate, just take the raw text directly
  if (slots.value.branch && slots.value.car_type && slots.value.wash_package && slots.value.date && slots.value.time && slots.value.datetime && !slots.value.license_plate) {
    slots.value.license_plate = text.toUpperCase().replace(/\s+/g, '')
    await evaluateNextQuestion()
    return
  }

  loading.value = true
  let success = false
  try {
    // 2. Call backend Wit.ai API proxy
    const config = useRuntimeConfig()
    const data = await $fetch(`${config.public.apiBase}/chat/message`, {
      method: 'POST',
      body: { text }
    })

    // 3. Process entities from Wit.ai response
    success = processWitEntities(data, text)
  } catch (err) {
    console.error("Wit.ai chat error:", err)
    // Fallback: manually parse inputs if Wit.ai is offline
    parseTextFallback(text)
    success = true
  } finally {
    loading.value = false
    if (success) {
      await evaluateNextQuestion()
    }
  }
}

function addMessage(sender, text, optionsType = null, extra = {}) {
  messages.value.push({
    id: Date.now() + Math.random(),
    sender,
    text,
    optionsType,
    ...extra
  })
}

function processWitEntities(data, rawText) {
  const intents = data.intents || []
  const entities = data.entities || {}

  // Prioritize book_car_wash intent. If it's present or if raw text matches booking expressions, process slots
  const hasEntity = !!(entities['booking_date:booking_date'] || entities['branch:branch'] || entities['car_type:car_type'] || entities['wash_package:wash_package'] || entities['wit$datetime:datetime'])
  const hasIntent = (intents.length > 0 && intents[0].name === 'book_car_wash') || hasEntity || checkRawTextForBookingIntent(rawText)
  
  // Also check if we matched any slots either through prior conversation or raw text keywords
  const hasMatchedAnySlot = slots.value.branch || slots.value.car_type || slots.value.wash_package || slots.value.date || slots.value.time || slots.value.datetime
  const textMatchedAnySlot = checkRawTextForSlots(rawText)

  if (!hasIntent && !hasMatchedAnySlot && !textMatchedAnySlot && chatStep.value === 'greeting') {
    addMessage('assistant', 'უკაცრავად, ვერ გავიგე. შეგიძლიათ სხვაგვარად მითხრათ?')
    return false
  }

  // Set the step to collecting to enable slot-filling flow
  chatStep.value = 'collecting'

  // Extract Branch from Wit.ai
  const branchEnt = entities['branch:branch'] || entities['branch'] || entities['location']
  if (branchEnt && branchEnt[0]) {
    const val = (branchEnt[0].value || branchEnt[0].body || '').toLowerCase()
    for (const [key, id] of Object.entries(branchMap)) {
      if (val.includes(key)) {
        slots.value.branch = id
        break
      }
    }
  }

  // 1. Extract Car Type from Wit.ai
  const carTypeEnt = entities['car_type:car_type'] || entities['car_type']
  if (carTypeEnt && carTypeEnt[0]) {
    const val = (carTypeEnt[0].value || carTypeEnt[0].body || '').toLowerCase()
    for (const [key, id] of Object.entries(carTypeMap)) {
      if (val.includes(key)) {
        slots.value.car_type = id
        break
      }
    }
  }

  // 2. Extract Wash Package from Wit.ai
  const washPackageEnt = entities['wash_package:wash_package'] || entities['wash_package']
  if (washPackageEnt && washPackageEnt[0]) {
    const val = (washPackageEnt[0].value || washPackageEnt[0].body || '').toLowerCase()
    for (const [key, id] of Object.entries(packageMap)) {
      if (val.includes(key)) {
        slots.value.wash_package = id
        break
      }
    }
  }

  // 3. Extract Datetime & Booking Date from Wit.ai
  const datetimeEnt = entities['wit$datetime:datetime'] || entities['wit$datetime']
  if (datetimeEnt && datetimeEnt[0]) {
    const val = datetimeEnt[0].value
    if (val) {
      const matchTime = val.match(/T(\d{2}):(\d{2})/)
      if (matchTime && !slots.value.time) {
        slots.value.time = `${matchTime[1]}:${matchTime[2]}`
      }
    }
  }

  const bookingDateEnt = entities['booking_date:booking_date'] || entities['booking_date']
  if (bookingDateEnt && bookingDateEnt[0]) {
    const dateText = bookingDateEnt[0].value || bookingDateEnt[0].body
    const parsedDt = extractGeorgianDateTime(dateText, slots.value.date, slots.value.time)
    if (parsedDt && parsedDt.hasDate) {
      slots.value.date = parsedDt.dateStr
    }
  }

  // 4. Apply raw text fallbacks/overrides for extra robustness
  applyRawTextSlots(rawText)

  return true
}

function checkRawTextForBookingIntent(text) {
  const lowerText = text.toLowerCase()
  const bookingKeywords = [
    'გარეცხვა', 'რეცხვა', 'დაჯავშნა', 'დავჯავშნო', 'ჯავშანი', 'ავტომობილის', 'მანქანის', 
    'wash', 'book', 'booking', 'reservation'
  ]
  return bookingKeywords.some(key => lowerText.includes(key))
}

const GEORGIAN_MONTH_NAMES = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3) return dateStr
  const day = parts[2]
  const monthName = GEORGIAN_MONTH_NAMES[parts[1] - 1] || ''
  return `${day} ${monthName}`
}

function extractGeorgianDateTime(text, existingDateStr = null, existingTimeStr = null) {
  if (!text) return null
  const lower = text.toLowerCase()

  const now = new Date()
  const tbilisiOffsetMs = 4 * 60 * 60 * 1000
  const tbilisiNow = new Date(now.getTime() + tbilisiOffsetMs)

  let year = tbilisiNow.getUTCFullYear()
  let month = tbilisiNow.getUTCMonth()
  let day = tbilisiNow.getUTCDate()
  let hour = 12
  let minute = 0
  let hasDate = false
  let hasTime = false

  if (existingDateStr) {
    const parts = existingDateStr.split('-').map(Number)
    if (parts.length === 3) {
      year = parts[0]
      month = parts[1] - 1
      day = parts[2]
    }
  }

  if (existingTimeStr) {
    const parts = existingTimeStr.split(':').map(Number)
    if (parts.length === 2) {
      hour = parts[0]
      minute = parts[1]
    }
  }

  const geoMonths = [
    { regex: /იანვ(?:არს|არი|რის)?/, m: 0 },
    { regex: /თებერვ(?:ალს|ალი|ლის)?/, m: 1 },
    { regex: /მარტ(?:ს|ი|ის)?/, m: 2 },
    { regex: /აპრილ(?:ს|ი|ის)?/, m: 3 },
    { regex: /მაის(?:ს|ი|ის)?/, m: 4 },
    { regex: /ივნის(?:ს|ი|ის)?/, m: 5 },
    { regex: /ივლის(?:ს|ი|ის)?/, m: 6 },
    { regex: /აგვისტ(?:ოს|ო)?/, m: 7 },
    { regex: /სექტემბ(?:ერს|ერი|რის)?/, m: 8 },
    { regex: /ოქტომბ(?:ერს|ერი|რის)?/, m: 9 },
    { regex: /ნოემბ(?:ერს|ერი|რის)?/, m: 10 },
    { regex: /დეკემბ(?:ერს|ერი|რის)?/, m: 11 },
  ]

  for (const gm of geoMonths) {
    const mMatch = lower.match(new RegExp('(\\d{1,2})\\s*' + gm.regex.source)) ||
                   lower.match(new RegExp(gm.regex.source + '\\s*(\\d{1,2})'))
    if (mMatch) {
      const dVal = parseInt(mMatch[1], 10)
      if (dVal >= 1 && dVal <= 31) {
        day = dVal
        month = gm.m
        if (month < tbilisiNow.getUTCMonth()) {
          year = tbilisiNow.getUTCFullYear() + 1
        } else {
          year = tbilisiNow.getUTCFullYear()
        }
        hasDate = true
        break
      }
    }
  }

  if (!hasDate) {
    const dayMatch = lower.match(/(?:^|\s|[.,!?])(\d{1,2})\s*(?:რიცხვ(?:ში|ს|ი)?|-?ში(?![ა-ჰa-zA-Z]))/)
    if (dayMatch) {
      const dVal = parseInt(dayMatch[1], 10)
      if (dVal >= 1 && dVal <= 31) {
        day = dVal
        if (day < tbilisiNow.getUTCDate()) {
          month = (tbilisiNow.getUTCMonth() + 1) % 12
          year = month === 0 ? tbilisiNow.getUTCFullYear() + 1 : tbilisiNow.getUTCFullYear()
        } else {
          month = tbilisiNow.getUTCMonth()
          year = tbilisiNow.getUTCFullYear()
        }
        hasDate = true
      }
    }
  }

  if (!hasDate) {
    const numDateMatch = lower.match(/(?:^|\s)(\d{1,2})[./\-](\d{1,2})(?:[./\-](\d{2,4}))?(?:\s|$|[.,!?])/);
    if (numDateMatch) {
      const dVal = parseInt(numDateMatch[1], 10)
      const mVal = parseInt(numDateMatch[2], 10) - 1
      if (dVal >= 1 && dVal <= 31 && mVal >= 0 && mVal <= 11) {
        day = dVal
        month = mVal
        if (numDateMatch[3]) {
          const y = parseInt(numDateMatch[3], 10)
          year = y < 100 ? 2000 + y : y
        }
        hasDate = true
      }
    }
  }

  if (!hasDate) {
    if (lower.includes('დღეს') || lower.includes('today')) {
      day = tbilisiNow.getUTCDate()
      month = tbilisiNow.getUTCMonth()
      year = tbilisiNow.getUTCFullYear()
      hasDate = true
    } else if (lower.includes('ხვალ') || lower.includes('tomorrow')) {
      const d = new Date(tbilisiNow.getTime() + 24 * 60 * 60 * 1000)
      day = d.getUTCDate()
      month = d.getUTCMonth()
      year = d.getUTCFullYear()
      hasDate = true
    } else if (lower.includes('ზეგ')) {
      const d = new Date(tbilisiNow.getTime() + 48 * 60 * 60 * 1000)
      day = d.getUTCDate()
      month = d.getUTCMonth()
      year = d.getUTCFullYear()
      hasDate = true
    } else if (lower.includes('მაზეგ')) {
      const d = new Date(tbilisiNow.getTime() + 72 * 60 * 60 * 1000)
      day = d.getUTCDate()
      month = d.getUTCMonth()
      year = d.getUTCFullYear()
      hasDate = true
    }
  }

  if (!hasDate) {
    const weekdays = [
      { name: 'კვირას', day: 0 },
      { name: 'ორშაბათს', day: 1 },
      { name: 'სამშაბათს', day: 2 },
      { name: 'ოთხშაბათს', day: 3 },
      { name: 'ხუთშაბათს', day: 4 },
      { name: 'პარასკევს', day: 5 },
      { name: 'შაბათს', day: 6 },
    ]
    for (const wd of weekdays) {
      if (lower.includes(wd.name)) {
        const curDay = tbilisiNow.getUTCDay()
        let diff = wd.day - curDay
        if (diff <= 0) diff += 7
        const target = new Date(tbilisiNow.getTime() + diff * 24 * 60 * 60 * 1000)
        day = target.getUTCDate()
        month = target.getUTCMonth()
        year = target.getUTCFullYear()
        hasDate = true
        break
      }
    }
  }

  const timeExact = lower.match(/(?:^|\s|[.,!?])(\d{1,2}):(\d{2})/)
  if (timeExact) {
    const h = parseInt(timeExact[1], 10)
    const m = parseInt(timeExact[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      hour = h
      minute = m
      hasTime = true
    }
  } else {
    const timeWord = lower.match(/(?:^|\s|[.,!?])(\d{1,2})\s*(?:საათზე|საათი|სთ-ზე|სთ|-ზე(?![ა-ჰa-zA-Z]))/)
    if (timeWord) {
      let h = parseInt(timeWord[1], 10)
      if (h >= 1 && h <= 8) h += 12
      if (h >= 0 && h <= 23) {
        hour = h
        minute = 0
        hasTime = true
      }
    }
  }

  if (!hasDate && !hasTime) return null

  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = hasDate ? `${year}-${pad(month + 1)}-${pad(day)}` : (existingDateStr || null)
  const timeStr = hasTime ? `${pad(hour)}:${pad(minute)}` : (existingTimeStr || null)

  return {
    hasDate,
    hasTime,
    dateStr,
    timeStr,
    iso: (dateStr && timeStr) ? `${dateStr}T${timeStr}:00.000Z` : null
  }
}

function checkRawTextForSlots(text) {
  const lowerText = text.toLowerCase()
  const hasBranch = Object.keys(branchMap).some(key => lowerText.includes(key))
  const hasCar = Object.keys(carTypeMap).some(key => lowerText.includes(key))
  const hasPkg = Object.keys(packageMap).some(key => lowerText.includes(key))
  const parsedDt = extractGeorgianDateTime(text, slots.value.date, slots.value.time)
  return hasBranch || hasCar || hasPkg || !!parsedDt
}

function applyRawTextSlots(text) {
  const lowerText = text.toLowerCase()
  
  if (!slots.value.branch) {
    for (const [key, value] of Object.entries(branchMap)) {
      if (lowerText.includes(key)) {
        slots.value.branch = value
        break
      }
    }
  }

  if (!slots.value.car_type) {
    for (const [key, value] of Object.entries(carTypeMap)) {
      if (lowerText.includes(key)) {
        slots.value.car_type = value
        break
      }
    }
  }

  if (!slots.value.wash_package) {
    for (const [key, value] of Object.entries(packageMap)) {
      if (lowerText.includes(key)) {
        slots.value.wash_package = value
        break
      }
    }
  }

  // Parse Georgian dates and times with separated date and time fields
  const parsedDt = extractGeorgianDateTime(text, slots.value.date, slots.value.time)
  if (parsedDt) {
    if (parsedDt.hasDate) {
      slots.value.date = parsedDt.dateStr
    }
    if (parsedDt.hasTime) {
      slots.value.time = parsedDt.timeStr
    }
    if (slots.value.date && slots.value.time) {
      slots.value.datetime = `${slots.value.date}T${slots.value.time}:00.000Z`
    }
  }
}

function parseTextFallback(text) {
  applyRawTextSlots(text)
}

// Resolve chat shorthand IDs (v-sedan, s-standard) to real database UUIDs
function resolveVehicleTypeId(chatId) {
  const nameMap = {
    'v-sedan': ['sedan', 'სედანი'],
    'v-suv': ['suv', 'jeep', 'ჯიპი'],
    'v-minivan': ['minivan', 'მინივენი']
  }
  const keywords = nameMap[chatId] || []
  const match = bookingStore.vehicleTypes.find(v => {
    const name = (v.name || '').toLowerCase()
    return keywords.some(k => name.includes(k))
  })
  return match ? match.id : chatId
}

function resolveServiceId(chatId) {
  const nameMap = {
    's-standard': ['სტანდარტული', 'standard'],
    's-premium': ['პრემიუმ', 'premium', 'კომპლექსური', 'complex']
  }
  const keywords = nameMap[chatId] || []
  const match = bookingStore.services.find(s => {
    const title = (s.title?.ka || s.title?.en || s.name || '').toLowerCase()
    return keywords.some(k => title.includes(k))
  })
  return match ? match.id : chatId
}

function resolveBranchId(chatId) {
  const nameMap = {
    'br-saburtalo': ['saburtalo', 'საბურთალო'],
    'br-vake': ['vake', 'ვაკე'],
    'br-gldani': ['gldani', 'გლდანი']
  }
  const keywords = nameMap[chatId] || []
  const match = bookingStore.branches.find(b => {
    const name = (typeof b.name === 'string' ? b.name : (b.name?.ka || b.name?.en || '')).toLowerCase()
    return keywords.some(k => name.includes(k))
  })
  return match ? match.id : (bookingStore.branches[0]?.id || chatId)
}

function formatTimeOnly(isoString) {
  const d = new Date(isoString)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

async function evaluateNextQuestion() {
  if (chatStep.value === 'success') return

  // 1. Branch
  if (!slots.value.branch) {
    addMessage('assistant', 'რომელ ფილიალში გირჩევნიათ მოსვლა?', 'branch')
    return
  }
  // 2. Car Type
  if (!slots.value.car_type) {
    addMessage('assistant', 'რა ტიპის ავტომობილი გყავთ?', 'car_type')
    return
  }
  // 3. Wash Package
  if (!slots.value.wash_package) {
    addMessage('assistant', 'რა ტიპის რეცხვა გსურთ?', 'wash_package')
    return
  }

  // 4. Date (separate question from time)
  if (!slots.value.date) {
    if (slots.value.time) {
      addMessage('assistant', `საათი (${slots.value.time}) გასაგებია. რომელ დღეს ან რიცხვში გირჩევნიათ მოსვლა?`)
    } else {
      addMessage('assistant', 'რომელ დღეს ან რიცხვში გირჩევნიათ მოსვლა?')
    }
    return
  }

  // 5. Date is known -> Check available slots for this date
  loading.value = true
  try {
    const config = useRuntimeConfig()
    const realVehicleTypeId = resolveVehicleTypeId(slots.value.car_type)
    const realServiceId = resolveServiceId(slots.value.wash_package)
    const realBranchId = resolveBranchId(slots.value.branch)

    const queryParams = new URLSearchParams({
      date: slots.value.date,
      vehicleTypeId: realVehicleTypeId,
      serviceIds: realServiceId,
      branchId: realBranchId
    })

    const data = await $fetch(`${config.public.apiBase}/bookings/available-slots?${queryParams.toString()}`)
    const availableSlots = data?.slots || []
    const dateFormatted = formatDateOnly(slots.value.date)

    // CASE A: The entire date has NO available slots (completely booked)
    if (availableSlots.length === 0) {
      slots.value.date = null
      slots.value.datetime = null
      addMessage('assistant', `⚠️ სამწუხაროდ, ${dateFormatted}-ს თავისუფალი დრო არ არის. გთხოვთ სხვა თარიღი აირჩიოთ.`)
      return
    }

    // CASE B: Date is free, but user hasn't chosen a time yet
    if (!slots.value.time) {
      addMessage('assistant', 
        `📅 ${dateFormatted}-ს თავისუფალია შემდეგი საათები:\n\nაირჩიეთ სასურველი დრო ან ჩაწერეთ:`,
        'time_slots',
        { availableSlots }
      )
      return
    }

    // CASE C: User chosen a time -> Check if this specific time is available
    const chosenTimeUTC = `${slots.value.date}T${slots.value.time}:00.000Z`
    const isAvailable = availableSlots.some(slot => new Date(slot).getTime() === new Date(chosenTimeUTC).getTime())

    if (!isAvailable) {
      // The specific time is booked on this date, but other times exist! Keep date, clear time.
      const occupiedTime = slots.value.time
      slots.value.time = null
      slots.value.datetime = null
      addMessage('assistant', 
        `⚠️ სამწუხაროდ, ${dateFormatted}-ს ${occupiedTime} დაკავებულია.\n\nამ თარიღში თავისუფალია შემდეგი საათები:`,
        'time_slots',
        { availableSlots }
      )
      return
    }

    // Time IS available!
    slots.value.datetime = chosenTimeUTC

    // 6. License plate
    if (!slots.value.license_plate) {
      addMessage('assistant', 'გთხოვთ მიუთითოთ ავტომობილის სახელმწიფო ნომერი (მაგ: AA-111-AA):')
      return
    }

    // 7. Everything complete -> Show summary & confirmation
    showConfirmation()
  } catch (err) {
    console.warn('Could not check availability:', err)
    if (!slots.value.time) {
      addMessage('assistant', 'რომელ საათზე გირჩევნიათ მოსვლა?')
    } else if (!slots.value.license_plate) {
      addMessage('assistant', 'გთხოვთ მიუთითოთ ავტომობილის სახელმწიფო ნომერი (მაგ: AA-111-AA):')
    } else {
      showConfirmation()
    }
  } finally {
    loading.value = false
  }
}

function showConfirmation() {
  chatStep.value = 'confirming'
  const branchObj = bookingStore.branches.find(b => b.id === slots.value.branch)
  const branchName = branchObj ? (branchObj.name?.ka || branchObj.name) : 'საბურთალოს ფილიალი'
  const carName = vehicleTypeNames[slots.value.car_type]
  const packageName = packageNames[slots.value.wash_package]
  const dateFormatted = formatDateHuman(slots.value.datetime)
  
  addMessage('assistant', `შეჯამება:\n📍 ფილიალი: ${branchName}\n🚗 ავტომობილი: ${carName}\n🧼 სერვისი: ${packageName}\n📅 დრო: ${dateFormatted}\n🔢 ნომერი: ${slots.value.license_plate}\n\nადასტურებთ?`, 'confirmation')
}

// Button selections
async function selectBranch(id, label) {
  slots.value.branch = id
  addMessage('user', label)
  await evaluateNextQuestion()
}

async function selectCarType(id, label) {
  slots.value.car_type = id
  addMessage('user', label)
  await evaluateNextQuestion()
}

async function selectWashPackage(id, label) {
  slots.value.wash_package = id
  addMessage('user', label)
  await evaluateNextQuestion()
}

async function selectTimeSlot(isoSlot) {
  // Convert UTC slot to Georgian local time for display
  const d = new Date(isoSlot)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  addMessage('user', `${h}:${m}`)
  
  // Store as ISO string — the slot from API is already in correct UTC
  slots.value.datetime = isoSlot
  slots.value.date = isoSlot.slice(0, 10)
  slots.value.time = `${h}:${m}`
  await evaluateNextQuestion()
}

async function confirmBooking() {
  loading.value = true
  try {
    // Set up Pinia bookingStore to execute the API call
    bookingStore.customerName = customerAuth.customer?.name || 'ჩატის სტუმარი'
    bookingStore.customerPhone = customerAuth.customer?.phoneNumber || '+995555000000'
    bookingStore.selectedVehicleTypeId = resolveVehicleTypeId(slots.value.car_type)
    bookingStore.selectedServiceIds = [resolveServiceId(slots.value.wash_package)]
    bookingStore.selectedStartTime = slots.value.datetime
    bookingStore.paymentMethod = 'on_site'
    bookingStore.selectedBranchId = resolveBranchId(slots.value.branch)
    bookingStore.licensePlate = slots.value.license_plate
    
    // Admin/simulation override flag to skip SMS checks
    bookingStore.otpVerified = true
    bookingStore.otpCode = '0000'

    const result = await bookingStore.submitBooking()
    if (result && result.success) {
      chatStep.value = 'success'
      addMessage('assistant', '🎉 თქვენი ჯავშანი წარმატებით შეიქმნა!')
      // Refresh user's dashboard bookings list if logged in
      if (customerAuth.isAuthenticated) {
        customerAuth.fetchMyBookings()
      }
    } else {
      addMessage('assistant', `⚠️ შეცდომა ჯავშნის გაფორმებისას: ${result?.error || 'გთხოვთ სცადოთ მოგვიანებით'}`)
    }
  } catch (err) {
    console.error("Booking confirm failed:", err)
    addMessage('assistant', '⚠️ ჯავშნის გაფორმება ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.')
  } finally {
    loading.value = false
  }
}

async function rejectBooking() {
  // Clear slots and restart
  slots.value.branch = null
  slots.value.car_type = null
  slots.value.wash_package = null
  slots.value.date = null
  slots.value.time = null
  slots.value.datetime = null
  slots.value.license_plate = null
  chatStep.value = 'collecting'
  
  addMessage('assistant', 'კარგი, დავიწყოთ თავიდან.')
  await evaluateNextQuestion()
}

function formatDateHuman(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  
  const day = date.getUTCDate()
  const monthName = GEORGIAN_MONTH_NAMES[date.getUTCMonth()] || ''
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  
  return `${day} ${monthName} @ ${hour}:${min}`
}
</script>

<style scoped>
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Custom shadow & glass panel styles inside widget */
.glass-panel {
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>
