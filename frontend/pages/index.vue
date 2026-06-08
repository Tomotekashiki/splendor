<template>
  <div class="w-full max-w-lg mx-auto py-6 px-4">
    <!-- Header banner -->
    <div class="flex justify-between items-start mb-8">
      <div class="text-left">
        <h2 class="text-3xl font-extrabold text-brand-gradient mt-1 tracking-tight">Splendor</h2>
        <p class="text-slate-400 text-sm mt-1">{{ localeStore.t('widget_title') }}</p>
      </div>

      <div class="flex items-center gap-2 mt-2 shrink-0">
        <!-- Language Switcher -->
        <button 
          @click="localeStore.toggleLocale" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-brand-500/50 bg-white/5 hover:bg-brand-500/5 text-slate-300 hover:text-brand-400 text-xs font-bold transition duration-300 shrink-0"
        >
          <span>🌐</span>
          <span>{{ localeStore.locale === 'ka' ? 'EN' : 'ქარ' }}</span>
        </button>

        <!-- Logged-in Customer Status Chip (Opens Cabinet Modal) -->
        <div 
          v-if="customerAuth.isAuthenticated" 
          class="text-xs text-slate-300 font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-brand-500/55 hover:bg-brand-500/5 hover:text-brand-400 transition shrink-0"
          @click="showCabinet = true"
          title="პირადი კაბინეტი"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{{ customerAuth.customer?.name }}</span>
        </div>
      </div>
    </div>

    <!-- Steps indicator -->
    <div v-show="customerAuth.isAuthenticated" class="flex items-center mb-8 px-2 w-full">
      <template v-for="stepNum in 4" :key="stepNum">
        <div 
          class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 shrink-0"
          :class="[
            currentStep === stepNum 
              ? 'bg-brand-500 text-white ring-4 ring-brand-500/30' 
              : currentStep > stepNum 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-800 text-slate-400 border border-white/5'
          ]"
        >
          <span v-if="currentStep > stepNum">✓</span>
          <span v-else>{{ stepNum }}</span>
        </div>
        <div 
          v-if="stepNum < 4" 
          class="flex-1 h-[2px] transition-all duration-300"
          :class="[currentStep > stepNum ? 'bg-emerald-500' : 'bg-slate-800']"
        ></div>
      </template>
    </div>

    <!-- Forced Login/Register Card when not authenticated -->
    <div v-show="!customerAuth.isAuthenticated" class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden space-y-5 mb-8">
      


      <!-- AUTH FLOWS (Tabs Selection) -->
      <div class="space-y-5">
        <!-- Tabs selector header -->
        <div v-if="authMode !== 'forgot'" class="flex border-b border-white/10 mb-4">
          <button 
            type="button"
            @click="authMode = 'login'" 
            class="flex-1 py-3 text-center text-sm font-bold transition duration-200 border-b-2"
            :class="[authMode === 'login' ? 'border-brand-500 text-white font-black' : 'border-transparent text-slate-400 hover:text-slate-200']"
          >
            ავტორიზაცია
          </button>
          <button 
            type="button"
            @click="authMode = 'signup'" 
            class="flex-1 py-3 text-center text-sm font-bold transition duration-200 border-b-2"
            :class="[authMode === 'signup' ? 'border-brand-500 text-white font-black' : 'border-transparent text-slate-400 hover:text-slate-200']"
          >
            რეგისტრაცია
          </button>
        </div>

        <!-- Error banner -->
        <div v-if="store.error" class="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
          <span class="text-base mt-0.5">⚠️</span>
          <div>
            <h4 class="font-semibold leading-none mb-1">Error Occurred</h4>
            <p>{{ store.error }}</p>
          </div>
        </div>



        <!-- TAB 1: LOGIN FORM -->
        <div v-if="authMode === 'login'" class="space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ტელეფონის ნომერი</label>
            <input 
              type="text" 
              placeholder="5xx xxx xxx"
              v-model="loginForm.phoneNumber"
              class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">პაროლი</label>
            <input 
              type="password" 
              placeholder="••••••••"
              v-model="loginForm.password"
              class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
            <div class="flex justify-end pt-1">
              <button 
                type="button" 
                @click="authMode = 'forgot'"
                class="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition tracking-wide"
              >
                დაგავიწყდათ პაროლი?
              </button>
            </div>
          </div>
          
          <button 
            type="button"
            @click="submitLogin"
            :disabled="customerAuth.loading || !loginForm.phoneNumber || !loginForm.password"
            class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            შესვლა
          </button>
        </div>

        <!-- TAB 2: SIGN UP FORM -->
        <div v-else-if="authMode === 'signup'" class="space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">სახელი და გვარი</label>
            <input 
              type="text" 
              placeholder="სახელი და გვარი"
              v-model="signupForm.name"
              class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ტელეფონის ნომერი</label>
            <input 
              type="text" 
              placeholder="5xx xxx xxx"
              v-model="signupForm.phoneNumber"
              class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">პაროლი</label>
            <input 
              type="password" 
              placeholder="••••••••"
              v-model="signupForm.password"
              class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          <button 
            type="button"
            @click="submitRegister"
            :disabled="customerAuth.loading || !signupForm.name || !signupForm.password || !signupForm.phoneNumber"
            class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            რეგისტრაცია და შესვლა
          </button>
        </div>

        <!-- FORGOT PASSWORD FORM -->
        <div v-else-if="authMode === 'forgot'" class="space-y-4">
          <!-- Step 1: Enter Phone Number -->
          <div v-if="forgotForm.forgotStep === 1" class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ტელეფონის ნომერი</label>
              <input 
                type="text" 
                placeholder="5xx xxx xxx"
                v-model="forgotForm.phoneNumber"
                class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
            
            <button 
              type="button"
              @click="submitForgotRequest"
              :disabled="customerAuth.loading || !forgotForm.phoneNumber"
              class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              OTP კოდის გაგზავნა
            </button>
          </div>

          <!-- Step 2: Enter SMS OTP Code -->
          <div v-else-if="forgotForm.forgotStep === 2" class="space-y-4">
            <div class="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded-xl text-xs text-center font-medium">
              SMS კოდი გაეგზავნა ნომერს: <span class="text-white font-bold">{{ forgotForm.phoneNumber }}</span>
            </div>
            
            <div class="space-y-1">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">SMS კოდი</label>
              <input 
                type="text" 
                placeholder="0000"
                v-model="forgotForm.otpCode"
                class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm text-center font-bold tracking-widest"
              />
            </div>

            <button 
              type="button"
              @click="submitVerifyForgotOtp"
              :disabled="customerAuth.loading || !forgotForm.otpCode"
              class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              კოდის დადასტურება
            </button>
          </div>

          <!-- Step 3: Enter New Password -->
          <div v-else-if="forgotForm.forgotStep === 3" class="space-y-4">
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs text-center font-medium">
              კოდი წარმატებით დადასტურდა. შეიყვანეთ ახალი პაროლი.
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ახალი პაროლი</label>
              <input 
                type="password" 
                placeholder="••••••••"
                v-model="forgotForm.newPassword"
                class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <button 
              type="button"
              @click="submitResetPassword"
              :disabled="customerAuth.loading || !forgotForm.newPassword"
              class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              პაროლის განახლება
            </button>
          </div>

          <div class="text-center pt-2">
            <button 
              type="button" 
              @click="cancelForgot"
              class="text-xs font-bold text-slate-400 hover:text-white transition"
            >
              ავტორიზაციაზე დაბრუნება
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CARD -->
    <div v-show="customerAuth.isAuthenticated" class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden">
      <!-- Error banner -->
      <div v-if="store.error" class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
        <span class="text-base mt-0.5">⚠️</span>
        <div>
          <h4 class="font-semibold leading-none mb-1">Error Occurred</h4>
          <p>{{ store.error }}</p>
        </div>
      </div>

      <!-- STEP 1: BRANCH SELECTION -->
      <div v-if="currentStep === 1" class="space-y-5">
        <h3 class="text-lg font-bold text-white mb-2">{{ localeStore.t('step_branch') }}</h3>
        <p class="text-xs text-slate-400 -mt-2 mb-4">{{ localeStore.t('select_branch_desc') }}</p>

        <!-- Branch Matrix / Cards -->
        <div class="grid grid-cols-1 gap-3.5">
          <button 
            v-for="branch in store.branches" 
            :key="branch.id"
            @click="selectBranch(branch.id)"
            class="w-full text-left p-4 rounded-xl transition duration-205 border flex flex-col gap-1.5"
            :class="[
              store.selectedBranchId === branch.id 
                ? 'bg-brand-500/15 border-brand-500 text-white' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            ]"
          >
            <div class="flex justify-between items-center w-full">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🏢</span>
                <div>
                  <span class="font-bold text-base block">{{ localeStore.t(branch.name) }}</span>
                  <span class="text-xs text-slate-400 font-light block mt-0.5">{{ localeStore.t('branch_address') }}: {{ localeStore.t(branch.address) }}</span>
                </div>
              </div>
              <div 
                class="h-5 w-5 rounded-full border flex items-center justify-center shrink-0"
                :class="[store.selectedBranchId === branch.id ? 'border-brand-500 bg-brand-500' : 'border-white/20']"
              >
                <div v-if="store.selectedBranchId === branch.id" class="h-2 w-2 rounded-full bg-white"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- STEP 2: VEHICLE TYPE -->
      <div v-else-if="currentStep === 2" class="space-y-5">
        <h3 class="text-lg font-bold text-white mb-2">{{ localeStore.t('step_vehicle') }}</h3>
        <p class="text-xs text-slate-400 -mt-2 mb-4">{{ localeStore.t('select_vehicle_desc') }}</p>
        <div class="grid grid-cols-1 gap-3.5">
          <button 
            v-for="vehicle in store.vehicleTypes" 
            :key="vehicle.id"
            @click="selectVehicle(vehicle.id)"
            class="w-full text-left p-4 rounded-xl transition duration-200 border flex justify-between items-center"
            :class="[
              store.selectedVehicleTypeId === vehicle.id 
                ? 'bg-brand-500/15 border-brand-500 text-white' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            ]"
          >
            <div class="flex items-center gap-3.5">
              <span class="text-2xl">🚗</span>
              <span class="font-semibold text-base">{{ localeStore.t(vehicle.name) }}</span>
            </div>
            <div 
              class="h-5 w-5 rounded-full border flex items-center justify-center"
              :class="[store.selectedVehicleTypeId === vehicle.id ? 'border-brand-500 bg-brand-500' : 'border-white/20']"
            >
              <div v-if="store.selectedVehicleTypeId === vehicle.id" class="h-2 w-2 rounded-full bg-white"></div>
            </div>
          </button>
        </div>
      </div>

      <!-- STEP 3: SERVICES & PACKAGES -->
      <div v-else-if="currentStep === 3" class="space-y-5">
        <h3 class="text-lg font-bold text-white mb-2">{{ localeStore.t('step_services') }}</h3>
        <p class="text-xs text-slate-400 -mt-2 mb-4">{{ localeStore.t('select_services_desc') }}</p>

        <!-- Base package matrix -->
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{{ localeStore.t('base_package') }}</h4>
        <div class="grid grid-cols-1 gap-3 mb-6">
          <button 
            v-for="service in basePackages" 
            :key="service.id"
            @click="toggleBasePackage(service.id)"
            class="w-full text-left p-4 rounded-xl transition duration-200 border flex flex-col gap-1.5"
            :class="[
              store.selectedServiceIds.includes(service.id) 
                ? 'bg-brand-500/15 border-brand-500 text-white' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            ]"
          >
            <div class="flex justify-between items-center">
              <span class="font-bold text-base">{{ localeStore.t(service.name) }}</span>
              <span class="text-brand-400 font-extrabold">{{ localeStore.formatPrice(getMatrixDetails(service.id)?.price || 0) }}</span>
            </div>
            <p class="text-xs text-slate-400 font-light leading-relaxed">{{ localeStore.t(service.description) }}</p>
            <div class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mt-1">
              <span>⏱️ {{ getMatrixDetails(service.id)?.durationMinutes }} {{ localeStore.t('mins') }}</span>
            </div>
          </button>
        </div>

        <!-- Addons matrix -->
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{{ localeStore.t('addon') }}</h4>
        <div class="grid grid-cols-1 gap-3">
          <button 
            v-for="service in addonServices" 
            :key="service.id"
            @click="toggleAddon(service.id)"
            class="w-full text-left p-3.5 rounded-xl transition duration-200 border flex items-center justify-between"
            :class="[
              store.selectedServiceIds.includes(service.id) 
                ? 'bg-brand-500/15 border-brand-500 text-white' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            ]"
          >
            <div>
              <span class="font-bold text-sm block">{{ localeStore.t(service.name) }}</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">⏱️ +{{ getMatrixDetails(service.id)?.durationMinutes }} {{ localeStore.t('mins') }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-extrabold text-brand-400">+{{ localeStore.formatPrice(getMatrixDetails(service.id)?.price || 0) }}</span>
              <div 
                class="h-5 w-5 rounded border flex items-center justify-center transition-all"
                :class="[store.selectedServiceIds.includes(service.id) ? 'border-brand-500 bg-brand-500' : 'border-white/20']"
              >
                <span v-if="store.selectedServiceIds.includes(service.id)" class="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- STEP 4: DATE, TIME & CHECKOUT -->
      <div v-else-if="currentStep === 4" class="space-y-6">
        <h3 class="text-lg font-bold text-white mb-2">{{ localeStore.t('step_datetime') }}</h3>
        
        <!-- Premium Custom Calendar Date Picker -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">{{ localeStore.t('select_datetime_desc') }}</label>
          
          <div class="bg-slate-900/60 border border-white/5 rounded-2xl p-4.5 space-y-4">
            <!-- Calendar Navigation Header -->
            <div class="flex justify-between items-center px-1">
              <button 
                type="button"
                @click="prevMonth" 
                class="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition text-xs"
                :disabled="calendarYear === new Date().getFullYear() && calendarMonth === new Date().getMonth()"
              >
                ◀
              </button>
              <span class="text-xs font-extrabold text-white tracking-wider uppercase">{{ currentMonthName }}</span>
              <button 
                type="button"
                @click="nextMonth" 
                class="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 transition text-xs"
              >
                ▶
              </button>
            </div>

            <!-- Calendar Grid -->
            <div class="space-y-2">
              <!-- Weekday Headers -->
              <div class="grid grid-cols-7 gap-1 text-center">
                <span 
                  v-for="(day, idx) in (localeStore.locale === 'ka' ? weekdaysKa : weekdaysEn)" 
                  :key="idx" 
                  class="text-[9px] font-black text-slate-500 uppercase tracking-wider py-1"
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
                  @click="selectCalendarDay(day)"
                  :disabled="day.isPast || isNonWorkingDay(day)"
                  class="h-8 w-full rounded-lg text-xs font-bold transition flex items-center justify-center relative select-none disabled:opacity-20 disabled:cursor-not-allowed"
                  :class="[
                    isSelectedDay(day)
                      ? 'bg-brand-500 text-white font-extrabold shadow-lg shadow-brand-500/20'
                      : isToday(day)
                        ? 'border border-brand-400/50 text-brand-400 bg-brand-500/5 font-extrabold'
                        : day.isCurrentMonth
                          ? 'text-slate-200 hover:bg-white/5'
                          : 'text-slate-500 hover:bg-white/5',
                    (day.isPast || isNonWorkingDay(day)) ? 'line-through text-slate-600' : ''
                  ]"
                >
                  {{ day.dayNum }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Slot picker -->
        <div v-if="store.selectedDate" class="space-y-3">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ localeStore.t('live_calendar') }}</label>
            <span class="text-[10px] text-slate-500 font-medium">Bays capacity checked dynamically</span>
          </div>

          <div v-if="store.loadingSlots" class="text-center py-8">
            <div class="inline-block animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2"></div>
            <p class="text-xs text-slate-500 font-bold">{{ localeStore.t('syncing_calendar') }}</p>
          </div>

          <div v-else-if="store.availableSlots.length === 0" class="text-center py-8 bg-slate-900/40 border border-white/5 rounded-xl">
            <span class="text-xl">💤</span>
            <p class="text-xs text-slate-400 font-bold mt-2">No slots available on this date.</p>
          </div>

          <div v-else class="grid grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
            <button 
              v-for="slot in store.availableSlots" 
              :key="slot"
              @click="store.selectedStartTime = slot"
              class="p-2.5 rounded-lg text-xs font-bold border transition duration-150"
              :class="[
                store.selectedStartTime === slot
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              ]"
            >
              {{ formatSlotTime(slot) }}
            </button>
          </div>
        </div>

        <!-- Payment selector -->
        <div v-show="store.selectedStartTime" class="space-y-3 pt-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">{{ localeStore.t('payment_method') }}</label>
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="store.paymentMethod = 'on_site'"
              class="p-3.5 rounded-xl border text-center font-bold text-xs sm:text-sm transition"
              :class="[
                store.paymentMethod === 'on_site'
                  ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              ]"
            >
              🏪 {{ localeStore.t('pay_on_site') }}
            </button>
            <button 
              @click="store.paymentMethod = 'card_online'"
              class="p-3.5 rounded-xl border text-center font-bold text-xs sm:text-sm transition"
              :class="[
                store.paymentMethod === 'card_online'
                  ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              ]"
            >
              💳 {{ localeStore.t('pay_card') }}
            </button>
          </div>
        </div>

        <!-- Card Input fields -->
        <div v-if="store.paymentMethod === 'card_online' && store.selectedStartTime" class="space-y-3 p-4 rounded-xl bg-slate-900 border border-white/5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ localeStore.t('card_number') }} (Demo: 4111...)</label>
          <input 
            type="text" 
            :placeholder="localeStore.t('card_number')"
            v-model="store.cardNumber"
            class="w-full p-3 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-xs tracking-wider font-bold"
          />
        </div>

        <!-- Special Notes / Comments -->
        <div v-show="store.selectedStartTime" class="space-y-1">
          <label class="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">{{ localeStore.t('special_notes') }}</label>
          <textarea 
            rows="2"
            :placeholder="localeStore.t('special_notes')"
            v-model="store.notes"
            class="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-brand-500 text-sm resize-none"
          ></textarea>
        </div>
      </div>

      <!-- STEP 5: SUCCESS SCREEN -->
      <div v-else-if="currentStep === 5" class="space-y-6 text-center py-6">
        <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl text-emerald-400">🎉</span>
        </div>
        <div>
          <h3 class="text-2xl font-black text-white">{{ localeStore.t('success_title') }}</h3>
          <p class="text-xs text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
            {{ localeStore.t('success_desc') }}
          </p>
        </div>

        <div class="bg-white/5 border border-white/5 rounded-xl p-4 max-w-[260px] mx-auto space-y-2.5">
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{{ localeStore.t('booking_ref') }}</span>
            <span class="text-lg font-black text-brand-400 tracking-wider block mt-1">{{ confirmedBookingId }}</span>
          </div>
          <div class="border-t border-white/5 pt-2">
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{{ localeStore.t('branch') }}</span>
            <span class="text-xs font-bold text-slate-300 block mt-0.5">{{ localeStore.t(confirmedBranchName) }}</span>
          </div>
        </div>

        <button 
          @click="startNewBooking"
          class="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold w-full transition"
        >
          {{ localeStore.t('book_another') }}
        </button>
      </div>

      <!-- FOOTER ACTION BUTTONS -->
      <div v-if="currentStep < 5" class="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
        <div v-if="currentStep > 1">
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{{ localeStore.t('price') }}</span>
          <span class="text-lg font-black text-brand-400 block leading-none mt-1">{{ localeStore.formatPrice(store.selectedDetails.price) }}</span>
        </div>
        <div v-else></div>

        <div class="flex gap-2">
          <button 
            v-if="currentStep > 1" 
            @click="prevStep" 
            class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
          >
            {{ localeStore.t('back') }}
          </button>
          
          <button 
            v-if="currentStep < 4" 
            @click="nextStep"
            :disabled="!canProceed"
            class="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {{ localeStore.t('continue') }}
          </button>

          <button 
            v-else-if="currentStep === 4" 
            @click="submitBookingOrder"
            :disabled="submittingBooking || !canProceed"
            class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span v-if="submittingBooking" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            {{ localeStore.t('confirm_and_book') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Personal Cabinet Modal -->
    <div 
      v-if="showCabinet" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="showCabinet = false"
    >
      <div class="glass-panel w-full max-w-md rounded-2xl p-6 shadow-glass relative overflow-hidden border border-white/10 bg-slate-900/90 text-left flex flex-col max-h-[85vh]">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 class="text-lg font-bold text-white">{{ localeStore.locale === 'ka' ? 'პირადი კაბინეტი' : 'Personal Cabinet' }}</h3>
            <p class="text-[10px] text-slate-450 font-semibold tracking-wider uppercase mt-0.5">{{ localeStore.locale === 'ka' ? 'პროფილის ინფორმაცია და ჯავშნები' : 'Profile info & bookings' }}</p>
          </div>
          <button 
            @click="showCabinet = false" 
            class="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <!-- Profile details -->
        <div class="bg-white/5 rounded-xl p-4 border border-white/5 mb-5 space-y-2.5 shrink-0">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">{{ localeStore.locale === 'ka' ? 'სახელი და გვარი' : 'Full Name' }}:</span>
            <div v-if="isEditingName" class="flex items-center gap-2">
              <input 
                type="text" 
                v-model="editNameValue" 
                class="bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white text-xs w-36 focus:outline-none focus:border-brand-500"
                placeholder="სახელი და გვარი"
              />
              <button @click="submitUpdateName" class="text-emerald-400 hover:text-emerald-300 font-bold" title="შენახვა">💾</button>
              <button @click="isEditingName = false" class="text-rose-400 hover:text-rose-300 font-bold" title="გაუქმება">✕</button>
            </div>
            <div v-else class="flex items-center gap-2">
              <span class="text-white font-bold">{{ customerAuth.customer?.name }}</span>
              <button @click="startEditName" class="text-brand-400 hover:text-brand-300 text-[11px]" title="რედაქტირება">✏️</button>
            </div>
          </div>

          <div class="flex justify-between text-xs border-t border-white/5 pt-2.5">
            <span class="text-slate-400 font-medium">{{ localeStore.locale === 'ka' ? 'ტელეფონი' : 'Phone' }}:</span>
            <span class="text-white font-bold">{{ customerAuth.customer?.phoneNumber }}</span>
          </div>

        </div>

        <!-- My Bookings section header -->
        <div class="flex justify-between items-center mb-3 shrink-0">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ localeStore.t('my_bookings') }}</h4>
          <button 
            @click="refreshBookings"
            class="text-[10px] text-brand-400 hover:text-brand-300 font-bold transition flex items-center gap-1"
            :disabled="customerAuth.loading"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-2.5 w-2.5 border-2 border-brand-400 border-t-transparent rounded-full"></span>
            🔄 {{ localeStore.locale === 'ka' ? 'განახლება' : 'Refresh' }}
          </button>
        </div>

        <!-- Scrollable bookings list inside modal -->
        <div class="flex-grow overflow-y-auto space-y-3.5 pr-1 mb-5 min-h-[200px]">
          <div v-if="customerAuth.customerBookings.length === 0" class="text-center py-10 bg-white/5 rounded-xl border border-white/5">
            <span class="text-2xl">📅</span>
            <p class="text-xs text-slate-400 font-bold mt-2">{{ localeStore.locale === 'ka' ? 'აქტიური ჯავშნები ვერ მოიძებნა.' : 'No active bookings found.' }}</p>
          </div>
          <div 
            v-else
            v-for="booking in customerAuth.customerBookings" 
            :key="booking.id"
            class="p-3.5 bg-slate-950/40 border border-white/5 hover:border-brand-500/20 rounded-xl space-y-3 transition duration-150"
          >
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <span class="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-black border border-white/5 tracking-wider">
                  #{{ booking.bookingId }}
                </span>
                <span class="text-[10.5px] text-slate-400 block font-light mt-1">
                  ⏱️ {{ formatDateHuman(booking.startTime) }}
                </span>
              </div>
              
              <div class="flex flex-col items-end gap-1">
                <span 
                  class="text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border"
                  :class="[
                    booking.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' 
                      : booking.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-400/20'
                        : booking.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-455 border-rose-455/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-400/20'
                  ]"
                >
                  {{ getStatusLabel(booking.status) }}
                </span>
                <span 
                  class="text-[7.5px] px-1 py-0.5 rounded font-extrabold uppercase border"
                  :class="[
                    booking.paymentStatus === 'paid'
                      ? 'bg-emerald-500/5 text-emerald-500/80 border-emerald-500/10'
                      : 'bg-slate-800 text-slate-500 border-white/5'
                  ]"
                >
                  {{ booking.paymentMethod === 'card_online' ? (localeStore.locale === 'ka' ? 'ონლაინ' : 'Card') : (localeStore.locale === 'ka' ? 'ადგილზე' : 'On-site') }} / {{ booking.paymentStatus === 'paid' ? (localeStore.locale === 'ka' ? 'გადახდილი' : 'Paid') : (localeStore.locale === 'ka' ? 'გადაუხდელი' : 'Unpaid') }}
                </span>
              </div>
            </div>

            <div class="border-t border-white/5 pt-2 flex flex-col gap-1 text-[11px] text-slate-300">
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-bold text-[9px] uppercase tracking-wide">{{ localeStore.locale === 'ka' ? 'ფილიალი' : 'Branch' }}:</span>
                <span class="font-extrabold text-white">{{ localeStore.t(booking.branch?.name || 'საბურთალოს ფილიალი') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-bold text-[9px] uppercase tracking-wide">{{ localeStore.locale === 'ka' ? 'ავტომობილი' : 'Vehicle' }}:</span>
                <span class="font-bold text-slate-300">🚗 {{ booking.vehicleType?.name ? localeStore.t(booking.vehicleType.name) : 'სედანი' }}</span>
              </div>
              <div class="flex flex-col gap-1 border-t border-white/5 pt-1.5">
                <span class="text-slate-500 font-bold text-[9px] uppercase tracking-wide mb-0.5">{{ localeStore.locale === 'ka' ? 'სერვისები' : 'Services' }}:</span>
                <div class="flex flex-wrap gap-0.5">
                  <span 
                    v-for="s in booking.bookingServices" 
                    :key="s.serviceId"
                    class="text-[8px] bg-slate-950/80 text-brand-400 border border-white/5 px-1.5 py-0.5 rounded font-bold"
                  >
                    {{ s.service?.name ? localeStore.t(s.service.name) : 'რეცხვა' }}
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between border-t border-white/5 pt-2">
                <span class="text-slate-400 font-extrabold text-xs">{{ localeStore.locale === 'ka' ? 'სულ ფასი:' : 'Total Price:' }}</span>
                <span class="text-sm font-black text-brand-400">{{ localeStore.formatPrice(booking.totalPrice) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-white/5 pt-4 shrink-0">
          <button 
            type="button" 
            @click="handleLogout" 
            class="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            🚪 {{ localeStore.locale === 'ka' ? 'გამოსვლა' : 'Log Out' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useSettingsStore } from '~/stores/settingsStore'

const store = useBookingStore()
const localeStore = useLocaleStore()
const customerAuth = useCustomerAuthStore()
const settingsStore = useSettingsStore()

const currentStep = ref(1)
const submittingBooking = ref(false)
const confirmedBookingId = ref('')
const confirmedBranchName = ref('')
const showCabinet = ref(false)

function refreshBookings() {
  customerAuth.fetchMyBookings()
}

function handleLogout() {
  showCabinet.value = false
  customerAuth.logout()
}

function getStatusLabel(status) {
  if (localeStore.locale === 'ka') {
    if (status === 'completed') return 'დასრულებული'
    if (status === 'in_progress') return 'პროცესში'
    if (status === 'cancelled') return 'გაუქმებული'
    return 'მოლოდინში'
  } else {
    if (status === 'completed') return 'Completed'
    if (status === 'in_progress') return 'In Progress'
    if (status === 'cancelled') return 'Cancelled'
    return 'Pending'
  }
}

// Customer Authentication forms state
const authMode = ref('login')
const loginForm = ref({ phoneNumber: '', password: '' })
const signupForm = ref({
  name: '',
  password: '',
  phoneNumber: '',
  otpSent: false,
  sendingOtp: false,
  otpCode: ''
})
const forgotForm = ref({
  phoneNumber: '',
  forgotStep: 1,
  otpCode: '',
  newPassword: ''
})
const isEditingName = ref(false)
const editNameValue = ref('')

// Sync logged-in customer's details to booking fields
watch(() => customerAuth.customer, (newCust) => {
  if (newCust) {
    store.customerName = newCust.name || ""
    store.customerPhone = newCust.phoneNumber || ""
    customerAuth.fetchMyBookings()
  } else {
    store.customerName = ""
    store.customerPhone = ""
  }
}, { immediate: true })

const todayDateStr = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Premium Custom Calendar State and Methods
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())

const monthNamesKa = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"]
const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const weekdaysKa = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"]
const weekdaysEn = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

const currentMonthName = computed(() => {
  const names = localeStore.locale === 'ka' ? monthNamesKa : monthNamesEn
  return `${names[calendarMonth.value]} ${calendarYear.value}`
})

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value

  const firstDayInstance = new Date(year, month, 1)
  let startDayOfWeek = firstDayInstance.getDay()
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []

  // Padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevMonthDate = new Date(year, month - 1, daysInPrevMonth - i)
    days.push({
      date: prevMonthDate,
      dayNum: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPast: isDateInPast(prevMonthDate)
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d)
    days.push({
      date: currentDate,
      dayNum: d,
      isCurrentMonth: true,
      isPast: isDateInPast(currentDate)
    })
  }

  // Padding days for next month
  const totalSlots = 42
  const remainingSlots = totalSlots - days.length
  for (let n = 1; n <= remainingSlots; n++) {
    const nextMonthDate = new Date(year, month + 1, n)
    days.push({
      date: nextMonthDate,
      dayNum: n,
      isCurrentMonth: false,
      isPast: isDateInPast(nextMonthDate)
    })
  }

  return days
})

function isDateInPast(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate < today
}

function selectCalendarDay(day) {
  if (day.isPast || isNonWorkingDay(day)) return
  
  const y = day.date.getFullYear()
  const m = String(day.date.getMonth() + 1).padStart(2, '0')
  const d = String(day.date.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  store.selectedDate = dateStr
  store.selectedStartTime = ""
  store.fetchAvailableSlots()
}

function isNonWorkingDay(day) {
  const y = day.date.getFullYear()
  const m = String(day.date.getMonth() + 1).padStart(2, '0')
  const d = String(day.date.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`
  return settingsStore.calendarOverrides[dateStr] === "non_working"
}

function isSelectedDay(day) {
  if (!store.selectedDate) return false
  const y = day.date.getFullYear()
  const m = String(day.date.getMonth() + 1).padStart(2, '0')
  const d = String(day.date.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`
  return store.selectedDate === dateStr
}

function isToday(day) {
  const today = new Date()
  return day.date.getDate() === today.getDate() &&
         day.date.getMonth() === today.getMonth() &&
         day.date.getFullYear() === today.getFullYear()
}

function prevMonth() {
  const today = new Date()
  if (calendarYear.value === today.getFullYear() && calendarMonth.value <= today.getMonth()) {
    return
  }
  
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

// Filter packages vs addons
const basePackages = computed(() => {
  return store.services.filter(s => !s.isAddon)
})

const addonServices = computed(() => {
  return store.services.filter(s => s.isAddon)
})



onMounted(async () => {
  localeStore.initialize()
  customerAuth.initialize()
  await store.loadServiceGrid()
  await settingsStore.fetchPublicCalendarOverrides()

  if (customerAuth.isAuthenticated) {
    customerAuth.fetchMyBookings()
  }
})

function selectBranch(id) {
  store.selectedBranchId = id
  // Clear date & time when switching branch
  store.selectedDate = ""
  store.selectedStartTime = ""
  store.availableSlots = []
}

function selectVehicle(id) {
  store.selectedVehicleTypeId = id
  // Clear services when switching vehicle type
  store.selectedServiceIds = []
}

// Ensure the first step resets selected values to default if not set
if (store.vehicleTypes.length > 0 && !store.selectedVehicleTypeId) {
  store.selectedVehicleTypeId = store.vehicleTypes[0].id
}

function getMatrixDetails(serviceId) {
  return store.serviceMatrix.find(
    m => m.vehicleTypeId === store.selectedVehicleTypeId && m.serviceId === serviceId
  )
}

function toggleBasePackage(serviceId) {
  // Can only select ONE base package
  const addons = store.selectedServiceIds.filter(id => {
    const s = store.services.find(x => x.id === id)
    return s && s.isAddon
  })
  store.selectedServiceIds = [serviceId, ...addons]
}

function toggleAddon(serviceId) {
  const index = store.selectedServiceIds.indexOf(serviceId)
  if (index === -1) {
    store.selectedServiceIds.push(serviceId)
  } else {
    store.selectedServiceIds.splice(index, 1)
  }
}

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return !!store.selectedBranchId
  }
  if (currentStep.value === 2) {
    return !!store.selectedVehicleTypeId
  }
  if (currentStep.value === 3) {
    // Must select at least one base package
    return store.selectedServiceIds.some(id => {
      const s = store.services.find(x => x.id === id)
      return s && !s.isAddon
    })
  }
  if (currentStep.value === 4) {
    const hasDateTime = !!store.selectedDate && !!store.selectedStartTime
    const isPaymentValid = store.paymentMethod !== 'card_online' || !!store.cardNumber
    return customerAuth.isAuthenticated && hasDateTime && isPaymentValid
  }
  return false
})

async function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Authentication handlers
async function sendSignupOtp() {
  if (!signupForm.value.phoneNumber) return
  signupForm.value.sendingOtp = true
  
  // Re-use mock SMS OTP verification dispatcher in bookingStore
  const oldPhone = store.customerPhone
  store.customerPhone = signupForm.value.phoneNumber
  const success = await store.sendVerificationOtp()
  store.customerPhone = oldPhone
  
  signupForm.value.sendingOtp = false
  if (success) {
    signupForm.value.otpSent = true
  }
}

async function submitRegister() {
  store.error = null
  const payload = {
    name: signupForm.value.name,
    passwordHash: signupForm.value.password,
    phoneNumber: signupForm.value.phoneNumber,
    otpCode: "0000"
  }
  const result = await customerAuth.register(payload)
  if (result.success) {
    signupForm.value.otpSent = false
    signupForm.value.otpCode = ''
  } else {
    store.error = result.error || 'რეგისტრაცია ვერ მოხერხდა.'
  }
}

async function submitLogin() {
  store.error = null
  const result = await customerAuth.login(loginForm.value.phoneNumber, loginForm.value.password)
  if (!result.success) {
    store.error = result.error || 'ტელეფონის ნომერი ან პაროლი არასწორია.'
  }
}

async function submitForgotRequest() {
  store.error = null
  const response = await customerAuth.forgotPassword(forgotForm.value.phoneNumber)
  if (response && response.success) {
    forgotForm.value.forgotStep = 2
  } else {
    store.error = customerAuth.error || 'კოდის გაგზავნა ვერ მოხერხდა.'
  }
}

async function submitVerifyForgotOtp() {
  store.error = null
  const response = await customerAuth.verifyRecoveryOtp(
    forgotForm.value.phoneNumber,
    forgotForm.value.otpCode
  )
  if (response && response.success) {
    forgotForm.value.forgotStep = 3
  } else {
    store.error = customerAuth.error || 'არასწორი ან ვადაგასული SMS კოდი.'
  }
}

async function submitResetPassword() {
  store.error = null
  const response = await customerAuth.resetPassword(
    forgotForm.value.phoneNumber,
    forgotForm.value.otpCode,
    forgotForm.value.newPassword
  )
  if (response && response.success) {
    alert('პაროლი წარმატებით შეიცვალა. შეგიძლიათ გაიაროთ ავტორიზაცია ახალი პაროლით.')
    authMode.value = 'login'
    cancelForgot()
  } else {
    store.error = customerAuth.error || 'პაროლის შეცვლა ვერ მოხერხდა.'
  }
}

function cancelForgot() {
  forgotForm.value = {
    phoneNumber: '',
    forgotStep: 1,
    otpCode: '',
    newPassword: ''
  }
  authMode.value = 'login'
}

function startEditName() {
  isEditingName.value = true
  editNameValue.value = customerAuth.customer?.name || ""
}

async function submitUpdateName() {
  if (!editNameValue.value || editNameValue.value.trim().length < 2) {
    alert(localeStore.locale === 'ka' ? 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' : 'Name must be at least 2 characters.')
    return
  }
  
  const result = await customerAuth.updateProfile(editNameValue.value)
  if (result && result.success) {
    isEditingName.value = false
  } else {
    alert(customerAuth.error || 'სახელის განახლება ვერ მოხერხდა.')
  }
}



async function submitBookingOrder() {
  submittingBooking.value = true
  store.error = null

  // Capture selected branch name before submit resets choices
  const selectedBranch = store.branches.find(b => b.id === store.selectedBranchId)
  confirmedBranchName.value = selectedBranch ? selectedBranch.name : ''

  const result = await store.submitBooking()
  submittingBooking.value = false

  if (result.success) {
    confirmedBookingId.value = result.booking.bookingId
    currentStep.value = 5
    customerAuth.fetchMyBookings()
  }
}

function startNewBooking() {
  store.resetChoices()
  currentStep.value = 1
  store.loadServiceGrid()
}

function formatSlotTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateHuman(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' @ ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}
</script>
