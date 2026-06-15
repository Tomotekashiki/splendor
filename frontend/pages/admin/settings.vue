<template>
  <div class="space-y-6 max-w-5xl">
    <!-- Header -->
    <div>
      <h3 class="text-xl font-bold text-[#0C447C]">{{ localeStore.t('settings') }}</h3>
      <p class="text-brand-500 text-xs mt-1">{{ localeStore.t('settings_desc') }}</p>
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
      class="px-4 py-3.5 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {{ errorMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
      <!-- Left Column Skeleton -->
      <div class="space-y-6">
        <!-- SMS Credentials Skeleton -->
        <div class="glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass space-y-6 relative overflow-hidden min-h-[300px]">
          <div class="w-1/3 h-4 bg-slate-200/80 rounded animate-pulse"></div>
          <div class="w-2/3 h-3 bg-slate-200/50 rounded animate-pulse"></div>
          <div class="space-y-4 pt-4">
            <div class="space-y-2">
              <div class="w-1/4 h-2.5 bg-slate-200/80 rounded animate-pulse"></div>
              <div class="w-full h-10 bg-slate-100/50 rounded-xl border border-slate-100 animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="w-1/4 h-2.5 bg-slate-200/80 rounded animate-pulse"></div>
              <div class="w-full h-10 bg-slate-100/50 rounded-xl border border-slate-100 animate-pulse"></div>
            </div>
            <div class="w-full h-10 bg-slate-200/60 rounded-xl animate-pulse mt-6"></div>
          </div>
        </div>

        <!-- Configured Hours Skeleton -->
        <div class="glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass space-y-6 relative overflow-hidden min-h-[250px]">
          <div class="w-1/3 h-4 bg-slate-200/80 rounded animate-pulse"></div>
          <div class="w-2/3 h-3 bg-slate-200/50 rounded animate-pulse"></div>
          <div class="space-y-4 pt-2">
            <div class="w-full h-10 bg-slate-100/50 rounded-xl border border-slate-100 animate-pulse"></div>
            <div class="flex flex-wrap gap-2 pt-2">
              <div v-for="n in 6" :key="n" class="w-16 h-7 bg-slate-200/50 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column Skeleton (Calendar Picker) -->
      <div class="glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass space-y-6 relative overflow-hidden min-h-[450px]">
        <div class="w-1/3 h-4 bg-slate-200/80 rounded animate-pulse"></div>
        <div class="w-2/3 h-3 bg-slate-200/50 rounded animate-pulse"></div>
        
        <div class="bg-brand-100/20 border border-brand-100/30 rounded-2xl p-4 space-y-4">
          <!-- Month Control Header Skeleton -->
          <div class="flex justify-between items-center px-1">
            <div class="w-7 h-7 bg-slate-200/60 rounded-lg animate-pulse"></div>
            <div class="w-24 h-4.5 bg-slate-200/80 rounded animate-pulse"></div>
            <div class="w-7 h-7 bg-slate-200/60 rounded-lg animate-pulse"></div>
          </div>

          <!-- Weekdays & Grid Skeleton -->
          <div class="space-y-3">
            <div class="grid grid-cols-7 gap-1">
              <div v-for="n in 7" :key="n" class="h-4 bg-slate-200/40 rounded animate-pulse text-center"></div>
            </div>
            <div class="grid grid-cols-7 gap-2">
              <div v-for="n in 35" :key="n" class="h-10 bg-slate-100/50 border border-slate-100 rounded-lg flex items-center justify-center animate-pulse">
                <div class="w-4 h-4 bg-slate-200/60 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Central Spinner Loader overlay -->
        <div class="absolute inset-0 bg-[#F8FAFC]/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10 pointer-events-none rounded-2xl">
          <div class="inline-block animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full shadow-sm"></div>
          <span class="text-[9px] text-[#0C447C] font-black uppercase tracking-widest animate-pulse">
            {{ localeStore.t('loading_data') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Grid Layout: SMS Settings & Configured Hours (Left) & Calendar Overrides (Right) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      <!-- Left Column: SMS Gateway Credentials & Configured Hours -->
      <div class="space-y-6">
        <!-- Panel 1: SMS Gateway Credentials -->
        <div class="glass-panel p-6 rounded-2xl border border-brand-100 shadow-glass space-y-6">
          <div>
            <h4 class="text-sm font-extrabold text-[#0C447C] uppercase tracking-wider mb-1">{{ localeStore.t('sms_settings_title') }}</h4>
            <p class="text-brand-500 text-[10px]">{{ localeStore.t('sms_settings_desc') }}</p>
          </div>

          <form @submit.prevent="handleSave" class="space-y-5">
            <!-- SMS Office Key input -->
            <div>
              <label 
                class="block text-brand-600 text-[10px] font-bold uppercase tracking-wider mb-2" 
                for="sms-gateway-key"
              >
                {{ localeStore.t('sms_gateway_api_key') }}
              </label>
              <input 
                id="sms-gateway-key"
                v-model="smsGatewayKey" 
                type="text" 
                required
                class="glass-input w-full px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider placeholder:text-brand-400/80"
                :placeholder="localeStore.t('sms_gateway_api_key_placeholder')" 
              />
            </div>

            <!-- SMS Sender Name input -->
            <div>
              <label 
                class="block text-brand-600 text-[10px] font-bold uppercase tracking-wider mb-2" 
                for="sms-sender-name"
              >
                {{ localeStore.t('sms_sender_name') }}
              </label>
              <input 
                id="sms-sender-name"
                v-model="smsSenderName" 
                type="text" 
                required
                class="glass-input w-full px-4 py-2.5 rounded-xl text-xs font-bold placeholder:text-brand-400/80"
                :placeholder="localeStore.t('sms_sender_name_placeholder')" 
              />
            </div>

            <!-- Submit CTA -->
            <div class="pt-2">
              <button 
                type="submit"
                class="bg-brand-500 text-white w-full font-bold px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10 disabled:opacity-55"
                :disabled="settingsStore.loading"
              >
                <span 
                  v-if="settingsStore.loading" 
                  class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></span>
                <span>{{ localeStore.t('save_settings') }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Panel 3: Configured Time Slots -->
        <div class="glass-panel p-6 rounded-2xl border border-brand-100 shadow-glass space-y-6">
          <div>
            <h4 class="text-sm font-extrabold text-[#0C447C] uppercase tracking-wider mb-1">
              {{ localeStore.t('configured_hours') }}
            </h4>
            <p class="text-brand-500 text-[10px]">{{ localeStore.t('configured_hours_desc') }}</p>
          </div>

          <!-- Branch Selector -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-brand-500 uppercase tracking-wide">
              {{ localeStore.t('select_branch') }}
            </label>
            <div class="relative">
              <select 
                v-model="selectedBranchId"
                @change="updateActiveHours"
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
          </div>

          <div class="space-y-4">
            <!-- Add New Hour Input Form -->
            <div class="flex gap-2">
              <input 
                v-model="newHourInput" 
                type="text" 
                :placeholder="localeStore.t('hour_placeholder')" 
                class="glass-input flex-1 px-4 py-2 rounded-xl text-xs font-mono"
                @keyup.enter="addConfiguredHour"
              />
              <button 
                type="button" 
                @click="addConfiguredHour"
                class="bg-brand-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
              >
                {{ localeStore.t('add_hour') }}
              </button>
            </div>

            <!-- Existing Hours List (Chips) -->
            <div v-if="configuredHours.length === 0" class="text-center py-4 text-[10px] text-brand-400">
              {{ localeStore.t('no_hours') }}
            </div>
            <div v-else class="flex flex-wrap gap-2 max-h-48 overflow-y-auto bg-brand-100/30 p-3 rounded-2xl border border-brand-100">
              <span 
                v-for="hour in sortedHours" 
                :key="hour"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-brand-100 text-xs font-mono font-bold text-[#0C447C]"
              >
                <span>{{ hour }}</span>
                <button 
                  type="button" 
                  @click="deleteConfiguredHour(hour)"
                  class="text-rose-500 hover:text-rose-700 font-bold text-[10px] w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-rose-50/70 transition"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 2: Working Days Calendar Picker -->
      <div class="glass-panel p-6 rounded-2xl border border-brand-100 shadow-glass space-y-6">
        <div>
          <h4 class="text-sm font-extrabold text-[#0C447C] uppercase tracking-wider mb-1">
            {{ localeStore.t('working_calendar') }}
          </h4>
          <p class="text-brand-500 text-[10px]">{{ localeStore.t('working_calendar_desc') }}</p>
        </div>

        <div class="bg-brand-100/40 border border-brand-100 rounded-2xl p-4 space-y-4">
          <!-- Month Header Controls -->
          <div class="flex justify-between items-center px-1">
            <button 
              type="button"
              @click="prevMonth" 
              class="h-7 w-7 rounded-lg flex items-center justify-center bg-brand-100/40 border border-brand-100 hover:bg-brand-200/40 text-brand-600 disabled:opacity-20 transition text-[10px]"
              :disabled="calendarYear === new Date().getFullYear() && calendarMonth === new Date().getMonth()"
            >
              ◀
            </button>
            <span class="text-xs font-extrabold text-brand-700 tracking-wider uppercase">
              {{ currentMonthName }}
            </span>
            <button 
              type="button"
              @click="nextMonth" 
              class="h-7 w-7 rounded-lg flex items-center justify-center bg-brand-100/40 border border-brand-100 hover:bg-brand-200/40 text-brand-600 transition text-[10px]"
            >
              ▶
            </button>
          </div>

          <!-- Calendar Overrides Month Grid -->
          <div class="space-y-2">
            <!-- Weekdays -->
            <div class="grid grid-cols-7 gap-1 text-center">
              <span 
                v-for="(day, idx) in (localeStore.locale === 'ka' ? weekdaysKa : weekdaysEn)" 
                :key="idx" 
                class="text-[9px] font-black text-brand-400 uppercase tracking-wider py-1"
              >
                {{ day }}
              </span>
            </div>

            <!-- Days Grid -->
            <div class="grid grid-cols-7 gap-1 text-center">
              <button 
                v-for="(day, idx) in calendarDays" 
                :key="idx"
                type="button"
                @click="toggleDayStatus(day)"
                :disabled="day.isPast"
                class="h-10 w-full rounded-lg text-xs font-bold transition flex flex-col items-center justify-center relative select-none disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/40"
                :class="[
                  isToday(day) ? 'border border-brand-400/50 bg-brand-500/5' : '',
                  isNonWorkingDay(day)
                    ? 'bg-rose-50 border border-rose-200 text-rose-600 line-through'
                    : 'text-[#0C447C]'
                ]"
              >
                <span>{{ day.dayNum }}</span>
                <!-- Green / Red dot indicators -->
                <span 
                  class="w-1 h-1 rounded-full mt-1.5"
                  :class="[isNonWorkingDay(day) ? 'bg-rose-400' : 'bg-emerald-400']"
                ></span>
              </button>
            </div>
          </div>

          <!-- Calendar Info Legend -->
          <div class="flex items-center justify-center gap-4 text-[9px] font-bold uppercase tracking-wider border-t border-brand-100 pt-3">
            <div class="flex items-center gap-1.5 text-brand-600">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{{ localeStore.t('working') }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-brand-600">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>{{ localeStore.t('non_working') }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useLocaleStore } from "../../stores/localeStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useBookingStore } from "../../stores/bookingStore";

definePageMeta({
  layout: "admin"
});

const localeStore = useLocaleStore();
const settingsStore = useSettingsStore();
const bookingStore = useBookingStore();

const selectedBranchId = ref("");

const smsGatewayKey = ref("");
const smsSenderName = ref("");
const successMessage = ref("");
const errorMessage = ref("");

// Month navigation calendar state
const calendarYear = ref(new Date().getFullYear());
const calendarMonth = ref(new Date().getMonth());

const monthNamesKa = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const weekdaysKa = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
const weekdaysEn = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const currentMonthName = computed(() => {
  const names = localeStore.locale === 'ka' ? monthNamesKa : monthNamesEn;
  return `${names[calendarMonth.value]} ${calendarYear.value}`;
});

const calendarDays = computed(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;

  const firstDayInstance = new Date(year, month, 1);
  let startDayOfWeek = firstDayInstance.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevMonthDate = new Date(year, month - 1, daysInPrevMonth - i);
    const dateStr = formatDateStr(prevMonthDate);
    days.push({
      date: prevMonthDate,
      dateStr,
      dayNum: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPast: isDateInPast(prevMonthDate)
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const dateStr = formatDateStr(currentDate);
    days.push({
      date: currentDate,
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isPast: isDateInPast(currentDate)
    });
  }

  // Padding days for next month
  const totalSlots = 42;
  const remainingSlots = totalSlots - days.length;
  for (let n = 1; n <= remainingSlots; n++) {
    const nextMonthDate = new Date(year, month + 1, n);
    const dateStr = formatDateStr(nextMonthDate);
    days.push({
      date: nextMonthDate,
      dateStr,
      dayNum: n,
      isCurrentMonth: false,
      isPast: isDateInPast(nextMonthDate)
    });
  }

  return days;
});

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDateInPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

function isToday(day) {
  const today = new Date();
  return day.date.getFullYear() === today.getFullYear() &&
         day.date.getMonth() === today.getMonth() &&
         day.date.getDate() === today.getDate();
}

function isNonWorkingDay(day) {
  return settingsStore.calendarOverrides[day.dateStr] === "non_working";
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
}

const toggleDayStatus = async (day) => {
  if (day.isPast) return;
  
  const currentStatus = settingsStore.calendarOverrides[day.dateStr] || "working";
  const newStatus = currentStatus === "working" ? "non_working" : "working";
  
  const res = await settingsStore.toggleCalendarOverride(day.dateStr, newStatus);
  if (res && res.success) {
    successMessage.value = localeStore.t('toggle_status_success');
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } else {
    errorMessage.value = res.error || settingsStore.error || localeStore.t('toggle_status_error');
    setTimeout(() => {
      errorMessage.value = "";
    }, 4000);
  }
};

const configuredHours = ref([]);
const newHourInput = ref("");

const sortedHours = computed(() => {
  return [...configuredHours.value].sort((a, b) => {
    const [hA, mA] = a.split(":").map(Number);
    const [hB, mB] = b.split(":").map(Number);
    return hA !== hB ? hA - hB : mA - mB;
  });
});

async function addConfiguredHour() {
  const time = newHourInput.value.trim();
  // Validate format HH:MM
  if (!/^\d{2}:\d{2}$/.test(time)) {
    errorMessage.value = localeStore.t('hour_format_error');
    setTimeout(() => {
      errorMessage.value = "";
    }, 4000);
    return;
  }

  // Check if exists
  if (configuredHours.value.includes(time)) {
    errorMessage.value = localeStore.t('hour_exists_error');
    setTimeout(() => {
      errorMessage.value = "";
    }, 4000);
    return;
  }

  configuredHours.value.push(time);
  newHourInput.value = "";

  // Save changes
  await saveHours();
}

async function deleteConfiguredHour(hour) {
  configuredHours.value = configuredHours.value.filter(h => h !== hour);
  await saveHours();
}

function updateActiveHours() {
  if (selectedBranchId.value === "" && bookingStore.branches.length > 0) {
    selectedBranchId.value = bookingStore.branches[0].id;
  }

  if (selectedBranchId.value !== "") {
    configuredHours.value = [...(settingsStore.branchConfiguredHours[selectedBranchId.value] || [])];
  } else {
    configuredHours.value = [];
  }
}

async function saveHours() {
  if (selectedBranchId.value === "") return;

  errorMessage.value = "";
  successMessage.value = "";

  const payloadBranchHours = { 
    ...settingsStore.branchConfiguredHours,
    [selectedBranchId.value]: configuredHours.value
  };

  const res = await settingsStore.updateSettings(
    smsGatewayKey.value,
    smsSenderName.value,
    settingsStore.configuredHours,
    payloadBranchHours
  );

  if (res && res.success) {
    successMessage.value = localeStore.t('settings_saved_success');
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } else {
    errorMessage.value = res.error || settingsStore.error || localeStore.t('hours_save_error');
    setTimeout(() => {
      errorMessage.value = "";
    }, 4000);
  }
}

const handleSave = async () => {
  successMessage.value = "";
  errorMessage.value = "";

  const res = await settingsStore.updateSettings(
    smsGatewayKey.value, 
    smsSenderName.value, 
    settingsStore.configuredHours, 
    settingsStore.branchConfiguredHours
  );
  if (res && res.success) {
    successMessage.value = localeStore.t('settings_saved_success');
    setTimeout(() => {
      successMessage.value = "";
    }, 4000);
  } else {
    errorMessage.value = res.error || settingsStore.error || localeStore.t('settings_save_error');
  }
};

const isLoading = computed(() => {
  return settingsStore.loading || bookingStore.loadingGrid || bookingStore.branches.length === 0;
});

onMounted(async () => {
  localeStore.initialize();
  await settingsStore.fetchSettings();
  await settingsStore.fetchCalendarOverrides();
  await bookingStore.loadServiceGrid();
  if (bookingStore.branches.length > 0) {
    selectedBranchId.value = bookingStore.branches[0].id;
  }
  smsGatewayKey.value = settingsStore.smsGatewayKey;
  smsSenderName.value = settingsStore.smsSenderName;
  updateActiveHours();
});
</script>
