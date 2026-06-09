<template>
  <div class="space-y-6 max-w-5xl">
    <!-- Header -->
    <div>
      <h3 class="text-xl font-bold text-white">{{ localeStore.t('settings') }}</h3>
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

    <!-- Grid Layout: SMS Settings (Left) & Calendar Overrides (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      <!-- Panel 1: SMS Gateway Credentials -->
      <div class="glass-panel p-6 rounded-2xl border border-brand-100 shadow-glass space-y-6">
        <div>
          <h4 class="text-sm font-extrabold text-white uppercase tracking-wider mb-1">SMS Office პარამეტრები</h4>
          <p class="text-brand-500 text-[10px]">გაწერეთ API გასაღებები მომხმარებლის OTP შეტყობინებებისთვის.</p>
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
              class="glass-input w-full px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider bg-brand-100/40 text-brand-800 placeholder:text-brand-400/80 border border-brand-200 focus:border-brand-500/50 focus:outline-none transition duration-300"
              placeholder="Enter your SMS Office API Key" 
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
              class="glass-input w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-100/40 text-brand-800 placeholder:text-brand-400/80 border border-brand-200 focus:border-brand-500/50 focus:outline-none transition duration-300"
              placeholder="e.g. Splendor" 
            />
          </div>

          <!-- Submit CTA -->
          <div class="pt-2">
            <button 
              type="submit"
              class="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition duration-300 shadow-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transform active:translate-y-0.5"
              :disabled="settingsStore.loading"
            >
              <span 
                v-if="settingsStore.loading" 
                class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"
              ></span>
              <span>{{ localeStore.t('save_settings') }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Panel 2: Working Days Calendar Picker -->
      <div class="glass-panel p-6 rounded-2xl border border-brand-100 shadow-glass space-y-6">
        <div>
          <h4 class="text-sm font-extrabold text-white uppercase tracking-wider mb-1">
            {{ localeStore.t('working_calendar') }}
          </h4>
          <p class="text-brand-500 text-[10px]">დააწკაპუნეთ სასურველ დღეზე მუშაობის სტატუსის შესაცვლელად (სამუშაო / დასვენება).</p>
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
                    ? 'bg-rose-50/70 border border-rose-500/20 text-rose-700 line-through'
                    : 'text-brand-700'
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

definePageMeta({
  layout: "admin"
});

const localeStore = useLocaleStore();
const settingsStore = useSettingsStore();

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

const handleSave = async () => {
  successMessage.value = "";
  errorMessage.value = "";

  const res = await settingsStore.updateSettings(smsGatewayKey.value, smsSenderName.value);
  if (res && res.success) {
    successMessage.value = localeStore.t('settings_saved_success');
    setTimeout(() => {
      successMessage.value = "";
    }, 4000);
  } else {
    errorMessage.value = res.error || settingsStore.error || "შეცდომა პარამეტრების შენახვისას.";
  }
};

onMounted(async () => {
  localeStore.initialize();
  await settingsStore.fetchSettings();
  await settingsStore.fetchCalendarOverrides();
  smsGatewayKey.value = settingsStore.smsGatewayKey;
  smsSenderName.value = settingsStore.smsSenderName;
});
</script>
