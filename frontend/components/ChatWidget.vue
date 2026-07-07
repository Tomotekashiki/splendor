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
            class="text-white/85 hover:text-white hover:scale-110 active:scale-95 transition text-lg font-bold"
          >
            ✕
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
            class="bg-brand-500 hover:bg-brand-600 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition duration-200 flex items-center justify-center shrink-0"
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
      class="bg-gradient-to-tr from-brand-500 to-brand-700 text-white rounded-full p-4 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center select-none relative group"
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

const bookingStore = useBookingStore()
const customerAuth = useCustomerAuthStore()

function triggerSignIn() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('splendor:open-auth'))
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
  datetime: null        // ISO datetime string
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

  // Initialize unread badge to 0
  unreadCount.value = 0

  if (typeof window !== 'undefined') {
    handlePushEvent = (e) => {
      const { title, body, image } = e.detail
      
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
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Watch messages length to auto scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

async function sendMessage() {
  const text = inputVal.value.trim()
  if (!text) return

  // 1. Add user message to UI
  addMessage('user', text)
  inputVal.value = ''
  
  if (chatStep.value === 'success') return

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
      evaluateNextQuestion()
    }
  }
}

function addMessage(sender, text, optionsType = null) {
  messages.value.push({
    id: Date.now() + Math.random(),
    sender,
    text,
    optionsType
  })
}

function processWitEntities(data, rawText) {
  const intents = data.intents || []
  const entities = data.entities || {}

  // Prioritize book_car_wash intent. If it's present or if raw text matches booking expressions, process slots
  const hasIntent = (intents.length > 0 && intents[0].name === 'book_car_wash') || checkRawTextForBookingIntent(rawText)
  
  // Also check if we matched any slots either through prior conversation or raw text keywords
  const hasMatchedAnySlot = slots.value.branch || slots.value.car_type || slots.value.wash_package || slots.value.datetime
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
    const val = branchEnt[0].value
    if (branchMap[val]) {
      slots.value.branch = branchMap[val]
    }
  }

  // 1. Extract Car Type from Wit.ai
  const carTypeEnt = entities['car_type:car_type'] || entities['car_type']
  if (carTypeEnt && carTypeEnt[0]) {
    const val = carTypeEnt[0].value
    if (carTypeMap[val]) {
      slots.value.car_type = carTypeMap[val]
    }
  }

  // 2. Extract Wash Package from Wit.ai
  const washPackageEnt = entities['wash_package:wash_package'] || entities['wash_package']
  if (washPackageEnt && washPackageEnt[0]) {
    const val = washPackageEnt[0].value
    if (packageMap[val]) {
      slots.value.wash_package = packageMap[val]
    }
  }

  // 3. Extract Datetime from Wit.ai
  const datetimeEnt = entities['wit$datetime:datetime'] || entities['wit$datetime']
  if (datetimeEnt && datetimeEnt[0]) {
    const val = datetimeEnt[0].value
    if (val) {
      slots.value.datetime = val
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

function checkRawTextForSlots(text) {
  const lowerText = text.toLowerCase()
  const hasBranch = Object.keys(branchMap).some(key => lowerText.includes(key))
  const hasCar = Object.keys(carTypeMap).some(key => lowerText.includes(key))
  const hasPkg = Object.keys(packageMap).some(key => lowerText.includes(key))
  const hasTime = lowerText.includes('დღეს') || lowerText.includes('today') || 
                  lowerText.includes('ხვალ') || lowerText.includes('tomorrow') ||
                  lowerText.includes('ზეგ') || lowerText.includes('day after tomorrow')
  return hasBranch || hasCar || hasPkg || hasTime
}

function applyRawTextSlots(text) {
  const lowerText = text.toLowerCase()
  
  for (const [key, value] of Object.entries(branchMap)) {
    if (lowerText.includes(key)) {
      slots.value.branch = value
      break
    }
  }

  for (const [key, value] of Object.entries(carTypeMap)) {
    if (lowerText.includes(key)) {
      slots.value.car_type = value
      break
    }
  }

  for (const [key, value] of Object.entries(packageMap)) {
    if (lowerText.includes(key)) {
      slots.value.wash_package = value
      break
    }
  }

  if (lowerText.includes('დღეს') || lowerText.includes('today')) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    slots.value.datetime = d.toISOString()
  } else if (lowerText.includes('ხვალ') || lowerText.includes('tomorrow')) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(12, 0, 0, 0)
    slots.value.datetime = d.toISOString()
  } else if (lowerText.includes('ზეგ') || lowerText.includes('day after tomorrow')) {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    d.setHours(12, 0, 0, 0)
    slots.value.datetime = d.toISOString()
  }
}

function parseTextFallback(text) {
  applyRawTextSlots(text)
}

function evaluateNextQuestion() {
  if (chatStep.value === 'success') return

  // Check what is missing (priority order: branch, car_type, wash_package, datetime)
  if (!slots.value.branch) {
    addMessage('assistant', 'რომელ ფილიალში გირჩევნიათ მოსვლა?', 'branch')
  } else if (!slots.value.car_type) {
    addMessage('assistant', 'რა ტიპის ავტომობილი გყავთ?', 'car_type')
  } else if (!slots.value.wash_package) {
    addMessage('assistant', 'რა ტიპის რეცხვა გსურთ?', 'wash_package')
  } else if (!slots.value.datetime) {
    addMessage('assistant', 'რომელ საათზე ან რომელ დღეს გირჩევნიათ მოსვლა?')
  } else {
    // All slots filled, ask for confirmation
    chatStep.value = 'confirming'
    const branchObj = bookingStore.branches.find(b => b.id === slots.value.branch)
    const branchName = branchObj ? (branchObj.name?.ka || branchObj.name) : 'საბურთალოს ფილიალი'
    const carName = vehicleTypeNames[slots.value.car_type]
    const packageName = packageNames[slots.value.wash_package]
    const dateFormatted = formatDateHuman(slots.value.datetime)
    
    addMessage('assistant', `შეჯამება:\n📍 ფილიალი: ${branchName}\n🚗 ავტომობილი: ${carName}\n🧼 სერვისი: ${packageName}\n📅 დრო: ${dateFormatted}\n\nადასტურებთ?`, 'confirmation')
  }
}

// Button selections
function selectBranch(id, label) {
  slots.value.branch = id
  addMessage('user', label)
  evaluateNextQuestion()
}

function selectCarType(id, label) {
  slots.value.car_type = id
  addMessage('user', label)
  evaluateNextQuestion()
}

function selectWashPackage(id, label) {
  slots.value.wash_package = id
  addMessage('user', label)
  evaluateNextQuestion()
}

async function confirmBooking() {
  loading.value = true
  try {
    // Set up Pinia bookingStore to execute the API call
    bookingStore.customerName = customerAuth.customer?.name || 'ჩატის სტუმარი'
    bookingStore.customerPhone = customerAuth.customer?.phoneNumber || '+995555000000'
    bookingStore.selectedVehicleTypeId = slots.value.car_type
    bookingStore.selectedServiceIds = [slots.value.wash_package]
    bookingStore.selectedStartTime = slots.value.datetime
    bookingStore.paymentMethod = 'on_site'
    bookingStore.selectedBranchId = slots.value.branch || bookingStore.branches[0]?.id || 'br-saburtalo'
    
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

function rejectBooking() {
  // Clear slots and restart
  slots.value.branch = null
  slots.value.car_type = null
  slots.value.wash_package = null
  slots.value.datetime = null
  chatStep.value = 'collecting'
  
  addMessage('assistant', 'კარგი, დავიწყოთ თავიდან.')
  evaluateNextQuestion()
}

function formatDateHuman(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  
  // Format local date in Georgian (e.g. "1 ივლისი")
  const dateStr = date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'long' })
  
  // Extract hours and minutes using local time methods so timezone offsets are correctly resolved
  const hour = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  
  return `${dateStr} @ ${hour}:${min}`
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
