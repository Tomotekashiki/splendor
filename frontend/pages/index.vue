<template>
  <div class="w-full max-w-3xl mx-auto py-6 px-4">
    <!-- Steps indicator -->
    <div v-show="customerAuth.isAuthenticated && currentStep < 5" class="glass-panel rounded-2xl p-5 sticky top-[72px] z-30 mb-8 max-w-xl mx-auto">
      <div class="flex items-center w-full">
        <template v-for="stepNum in 4" :key="stepNum">
          <div class="flex-grow flex items-center">
            <button 
              type="button"
              @click="goToStep(stepNum)"
              :disabled="!canGoToStep(stepNum)"
              class="flex flex-col items-center gap-1.5 min-w-0 w-full disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none"
            >
              <div 
                class="w-10 h-10 rounded-full grid place-items-center font-bold text-sm transition-all duration-300"
                :class="[
                  currentStep === stepNum 
                    ? 'bg-brand-500 text-white font-extrabold shadow-[0_0_24px_rgba(43,143,212,0.5)] ring-4 ring-brand-500/20' 
                    : currentStep > stepNum 
                      ? 'bg-emerald-500 text-white group-hover:scale-105' 
                      : 'glass-card text-brand-500 group-hover:scale-105 enabled:hover:border-brand-500/50'
                ]"
              >
                <svg v-if="currentStep > stepNum" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-4.5 h-4.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span v-else>{{ stepNum }}</span>
              </div>
              <span class="text-[10px] font-bold truncate transition-colors" :class="[currentStep === stepNum ? 'text-brand-700' : 'text-brand-500 group-hover:text-brand-700']">
                {{ 
                  stepNum === 1 ? (localeStore.locale === 'ka' ? 'ფილიალი' : 'Branch') : 
                  stepNum === 2 ? (localeStore.locale === 'ka' ? 'ავტომობილი' : 'Vehicle') : 
                  stepNum === 3 ? (localeStore.locale === 'ka' ? 'სერვისები' : 'Services') : 
                  (localeStore.locale === 'ka' ? 'დრო და გადახდა' : 'DateTime') 
                }}
              </span>
            </button>
            <div 
              v-if="stepNum < 4" 
              class="flex-1 h-px mx-1 mt-[-20px]"
              :class="[currentStep > stepNum ? 'bg-brand-505' : 'bg-brand-200/40']"
              style="height: 1px; background-color: rgba(12, 68, 124, 0.08);"
            ></div>
          </div>
        </template>
      </div>
    </div>

    <!-- Forced Login/Register Card when not authenticated -->
    <div v-show="!customerAuth.isAuthenticated" class="max-w-[420px] mx-auto py-4">
      <div class="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass relative overflow-hidden space-y-5 anim-slide-right">
        <!-- Tab selector -->
        <div v-if="authMode !== 'forgot'" class="glass-card rounded-full p-1 flex mb-6 text-sm font-semibold border border-brand-200/50 bg-brand-100/40">
          <button
            type="button"
            @click="authMode = 'login'"
            class="flex-grow py-2 rounded-full transition-all duration-200 text-xs font-bold"
            :class="[authMode === 'login' ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-brand-500 hover:text-brand-700']"
          >
            {{ localeStore.locale === 'ka' ? 'ავტორიზაცია' : 'Sign In' }}
          </button>
          <button
            type="button"
            @click="authMode = 'signup'"
            class="flex-grow py-2 rounded-full transition-all duration-200 text-xs font-bold"
            :class="[authMode === 'signup' ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-brand-500 hover:text-brand-700']"
          >
            {{ localeStore.locale === 'ka' ? 'რეგისტრაცია' : 'Sign Up' }}
          </button>
        </div>

        <!-- Error banner -->
        <div v-if="store.error" class="mb-4 p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-sm flex items-start gap-2.5 animate-pulse">
          <span class="text-base mt-0.5">⚠️</span>
          <div>
            <h4 class="font-semibold leading-none mb-1">შეცდომა</h4>
            <p>{{ store.error }}</p>
          </div>
        </div>

        <!-- TAB 1: LOGIN FORM -->
        <div v-if="authMode === 'login'" class="space-y-4">
          <!-- Phone field with +995 prefix -->
          <div class="relative glass-input rounded-xl flex items-center">
            <span class="px-3.5 py-3.5 font-mono text-sm text-brand-500 border-r border-brand-200/50">+995</span>
            <input 
              type="text" 
              placeholder="5xx xxx xxx"
              v-model="loginForm.phoneNumber"
              @input="loginForm.phoneNumber = loginForm.phoneNumber.replace(/\D/g, '').slice(0, 9)"
              class="flex-grow bg-transparent outline-none px-3.5 py-3.5 font-mono text-brand-700"
              required
            />
          </div>

          <!-- Password field -->
          <div class="relative glass-input rounded-xl flex items-center">
            <input 
              :type="showPwd ? 'text' : 'password'" 
              placeholder="••••••••"
              v-model="loginForm.password"
              class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700 pr-10"
              required
            />
            <button
              type="button"
              @click="showPwd = !showPwd"
              class="absolute right-3.5 text-brand-400 hover:text-brand-600 focus:outline-none"
            >
              <span v-if="showPwd">👁️</span>
              <span v-else>🙈</span>
            </button>
          </div>

          <div class="text-right">
            <button 
              type="button" 
              @click="authMode = 'forgot'"
              class="text-xs text-brand-500 hover:text-brand-700 transition-colors"
            >
              დაგავიწყდათ პაროლი?
            </button>
          </div>
          
          <button 
            type="button"
            @click="submitLogin"
            :disabled="customerAuth.loading || !loginForm.phoneNumber || !loginForm.password"
            class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            შესვლა
          </button>
        </div>

        <!-- TAB 2: SIGN UP FORM -->
        <div v-else-if="authMode === 'signup'" class="space-y-4">
          <!-- Full Name field -->
          <div class="relative glass-input rounded-xl">
            <input 
              type="text" 
              placeholder="სახელი და გვარი"
              v-model="signupForm.name"
              class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700"
              required
            />
          </div>

          <!-- Phone field with +995 prefix -->
          <div class="relative glass-input rounded-xl flex items-center">
            <span class="px-3.5 py-3.5 font-mono text-sm text-brand-500 border-r border-brand-200/50">+995</span>
            <input 
              type="text" 
              placeholder="5xx xxx xxx"
              v-model="signupForm.phoneNumber"
              @input="signupForm.phoneNumber = signupForm.phoneNumber.replace(/\D/g, '').slice(0, 9)"
              class="flex-grow bg-transparent outline-none px-3.5 py-3.5 font-mono text-brand-700"
              required
            />
          </div>

          <!-- Password field -->
          <div class="relative glass-input rounded-xl flex items-center">
            <input 
              :type="showPwd ? 'text' : 'password'" 
              placeholder="პაროლი"
              v-model="signupForm.password"
              class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700 pr-10"
              required
            />
            <button
              type="button"
              @click="showPwd = !showPwd"
              class="absolute right-3.5 text-brand-400 hover:text-brand-600 focus:outline-none"
            >
              <span v-if="showPwd">👁️</span>
              <span v-else>🙈</span>
            </button>
          </div>

          <!-- Password strength bar -->
          <div v-if="signupForm.password" class="space-y-1">
            <div class="h-1.5 rounded-full bg-brand-200/30 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :style="{
                  width: `${(passwordStrength.score / 4) * 100}%`,
                  background: passwordStrength.color,
                  boxShadow: `0 0 12px ${passwordStrength.color}88`,
                }"
              />
            </div>
            <p class="text-[10px] font-bold" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</p>
          </div>

          <button 
            type="button"
            @click="submitRegister"
            :disabled="customerAuth.loading || !signupForm.name || !signupForm.password || !signupForm.phoneNumber"
            class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            რეგისტრაცია და შესვლა
          </button>
        </div>

        <!-- FORGOT PASSWORD FLOW -->
        <div v-else-if="authMode === 'forgot'" class="space-y-4">
          <div v-if="forgotForm.forgotStep === 1" class="space-y-4">
            <div class="relative glass-input rounded-xl flex items-center">
              <span class="px-3.5 py-3.5 font-mono text-sm text-brand-500 border-r border-brand-200/50">+995</span>
              <input 
                type="text" 
                placeholder="5xx xxx xxx"
                v-model="forgotForm.phoneNumber"
                @input="forgotForm.phoneNumber = forgotForm.phoneNumber.replace(/\D/g, '').slice(0, 9)"
                class="flex-grow bg-transparent outline-none px-3.5 py-3.5 font-mono text-brand-700"
                required
              />
            </div>
            
            <button 
              type="button"
              @click="submitForgotRequest"
              :disabled="customerAuth.loading || !forgotForm.phoneNumber"
              class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              OTP კოდის გაგზავნა
            </button>
          </div>

          <div v-else-if="forgotForm.forgotStep === 2" class="space-y-4 text-center">
            <div class="p-3 bg-brand-100/50 border border-brand-200 text-brand-700 rounded-xl text-xs font-semibold">
              SMS კოდი გაეგზავნა ნომერს: <span class="font-extrabold text-brand-900">+995 {{ forgotForm.phoneNumber }}</span>
            </div>
            
            <div class="flex justify-center gap-3 py-2">
              <input 
                type="text" 
                placeholder="0000"
                v-model="forgotForm.otpCode"
                class="w-32 h-14 text-center text-2xl font-mono glass-input rounded-xl focus:ring-cyan-focus font-bold tracking-widest"
              />
            </div>

            <button 
              type="button"
              @click="submitVerifyForgotOtp"
              :disabled="customerAuth.loading || !forgotForm.otpCode"
              class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              კოდის დადასტურება
            </button>
          </div>

          <div v-else-if="forgotForm.forgotStep === 3" class="space-y-4">
            <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold text-center">
              კოდი წარმატებით დადასტურდა. შეიყვანეთ ახალი პაროლი.
            </div>

            <div class="relative glass-input rounded-xl">
              <input 
                type="password" 
                placeholder="ახალი პაროლი"
                v-model="forgotForm.newPassword"
                class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700"
                required
              />
            </div>

            <button 
              type="button"
              @click="submitResetPassword"
              :disabled="customerAuth.loading || !forgotForm.newPassword"
              class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              პაროლის განახლება
            </button>
          </div>

          <div class="text-center pt-2">
            <button 
              type="button" 
              @click="cancelForgot"
              class="text-xs font-bold text-brand-500 hover:text-brand-700 transition"
            >
              ავტორიზაციაზე დაბრუნება
            </button>
          </div>
        </div>

        <!-- Social Logins -->
        <div class="flex items-center gap-3 my-6">
          <div class="h-px flex-1 bg-brand-200/50" />
          <span class="text-[10px] uppercase font-bold tracking-wider text-brand-500">{{ localeStore.locale === 'ka' ? 'ან გააგრძელეთ' : 'or continue' }}</span>
          <div class="h-px flex-1 bg-brand-200/50" />
        </div>

        <div class="space-y-2.5">
          <button
            type="button"
            @click="customerAuth.login('Google User', '555000000')"
            class="w-full bg-white text-gray-800 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-sm border border-brand-200 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8L6 32.5C9.4 39.5 16.1 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.3 5.2c-.5.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            @click="customerAuth.login('Apple User', '555000001')"
            class="w-full bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.6 12.5c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1-.9 0-2.2-1-3.6-.9-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.4 1.4 11.1.9 1.3 2 2.8 3.5 2.7 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.9 1.5 0 2.5-1.3 3.4-2.7 1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-3-4.5zM14.8 4.3c.8-.9 1.3-2.2 1.1-3.4-1.1.1-2.4.7-3.2 1.6-.7.8-1.4 2.1-1.2 3.3 1.2.1 2.5-.6 3.3-1.5z" />
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN CARD -->
    <div v-show="customerAuth.isAuthenticated" class="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass relative overflow-hidden max-w-3xl mx-auto mt-8">
      <!-- Error banner -->
      <div v-if="store.error" class="mb-6 p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-sm flex items-start gap-2.5">
        <span class="text-base mt-0.5">⚠️</span>
        <div>
          <h4 class="font-semibold leading-none mb-1">შეცდომა</h4>
          <p>{{ store.error }}</p>
        </div>
      </div>

      <!-- STEP 1: BRANCH SELECTION -->
      <div v-if="currentStep === 1" class="space-y-6 anim-slide-right">
        <h2 class="text-xl font-bold text-brand-700 mb-6 font-serif-brand">{{ localeStore.t('chooseBranch') || 'აირჩიეთ ფილიალი' }}</h2>
        <div class="grid sm:grid-cols-2 gap-3.5">
          <button 
            v-for="branch in store.branches" 
            :key="branch.id"
            @click="selectBranch(branch.id)"
            class="relative glass-card rounded-xl p-4 text-left transition-all hover:scale-[1.01] duration-200 border border-brand-100 hover:border-brand-200"
            :style="store.selectedBranchId === branch.id ? { borderColor: 'rgba(43,143,212,0.6)', backgroundColor: 'rgba(43,143,212,0.08)', boxShadow: '0 0 24px rgba(43,143,212,0.2)' } : {}"
          >
            <div class="flex items-center gap-2 mb-2 text-brand-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div class="font-bold text-base text-brand-700">{{ localeStore.t(branch.name) }}</div>
            <div class="text-xs text-brand-500 mt-1 font-light">{{ localeStore.t(branch.address) }}</div>
            <span v-if="store.selectedBranchId === branch.id" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 grid place-items-center text-white shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <!-- STEP 2: VEHICLE TYPE -->
      <div v-else-if="currentStep === 2" class="space-y-6 anim-slide-right">
        <h2 class="text-xl font-bold text-brand-700 mb-6 font-serif-brand">{{ localeStore.t('chooseVehicle') || 'აირჩიეთ ავტომობილი' }}</h2>
        <div class="grid grid-cols-3 gap-3.5">
          <button 
            v-for="vehicle in store.vehicleTypes" 
            :key="vehicle.id"
            @click="selectVehicle(vehicle.id)"
            class="relative glass-card rounded-xl p-5 flex flex-col items-center gap-3.5 transition-all hover:scale-[1.02] duration-200 border border-brand-100 hover:border-brand-200"
            :class="{ 'scale-[1.03]': store.selectedVehicleTypeId === vehicle.id }"
            :style="store.selectedVehicleTypeId === vehicle.id ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.12)', boxShadow: '0 0 28px rgba(43,143,212,0.25)' } : {}"
          >
            <!-- Custom SVG Vehicle Icons mapped by ID -->
            <div v-if="vehicle.id === 'v-sedan'" class="w-full flex justify-center">
              <svg width="72" height="44" viewBox="0 0 72 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500">
                <path d="M3 30h66" />
                <path d="M6 30c0-1 .5-2 1.5-2.5L12 26l3-8c.8-2 2.5-3 4.5-3h22c2 0 3.8 1 5 2.5l5.5 7L60 26l3 1c1.5.5 2.5 1.5 2.5 3" />
                <path d="M15 18l4-3c1-.8 2.2-1.2 3.5-1.2h10M34 13.8h6c1.5 0 3 .6 4 1.7l3 2.5" opacity=".55" />
                <path d="M33 14v4" opacity=".4" />
                <circle cx="20" cy="32" r="4.5" />
                <circle cx="20" cy="32" r="1.3" />
                <circle cx="52" cy="32" r="4.5" />
                <circle cx="52" cy="32" r="1.3" />
              </svg>
            </div>
            <div v-else-if="vehicle.id === 'v-suv'" class="w-full flex justify-center">
              <svg width="72" height="44" viewBox="0 0 72 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500">
                <path d="M3 31h66" />
                <path d="M6 31V18c0-1.5 1-2.5 2.5-2.5h2l3-4c.6-.8 1.5-1.2 2.5-1.2h30c1.2 0 2.3.5 3 1.5l5 7 7 2c1.8.5 3 2 3 3.8V31" />
                <path d="M11 14h36M28 10v6" opacity=".5" />
                <path d="M8 10h6M58 10h6" opacity=".6" />
                <circle cx="20" cy="33" r="5" />
                <circle cx="20" cy="33" r="1.5" />
                <circle cx="52" cy="33" r="5" />
                <circle cx="52" cy="33" r="1.5" />
              </svg>
            </div>
            <div v-else class="w-full flex justify-center">
              <svg width="72" height="44" viewBox="0 0 72 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500">
                <path d="M3 32h66" />
                <path d="M5 32V14c0-1.7 1.3-3 3-3h44c1.5 0 2.8.7 3.7 1.9l7.3 9.6c1 1.3 1.5 3 1.5 4.6V32" />
                <path d="M10 14h42M22 14v10M34 14v10M46 14v10M54 16l5 7" opacity=".5" />
                <path d="M22 24h32" opacity=".35" />
                <circle cx="18" cy="34" r="5" />
                <circle cx="18" cy="34" r="1.5" />
                <circle cx="52" cy="34" r="5" />
                <circle cx="52" cy="34" r="1.5" />
              </svg>
            </div>

            <div class="font-bold text-sm sm:text-base text-brand-700">{{ localeStore.t(vehicle.name) }}</div>
          </button>
        </div>
      </div>

      <!-- STEP 3: SERVICES & PACKAGES -->
      <div v-else-if="currentStep === 3" class="space-y-6 anim-slide-right">
        <h2 class="text-xl font-bold text-brand-700 mb-6 font-serif-brand">{{ localeStore.t('chooseServices') || 'აირჩიეთ სერვისები' }}</h2>

        <!-- Base package matrix -->
        <div class="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">{{ localeStore.t('base_package') }}</div>
        <div class="space-y-2 mb-6">
          <button 
            v-for="service in basePackages" 
            :key="service.id"
            @click="toggleBasePackage(service.id)"
            class="w-full glass-card rounded-xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.005] duration-200 border border-brand-100 hover:border-brand-200"
            :style="store.selectedServiceIds.includes(service.id) ? { borderColor: 'rgba(43,143,212,0.6)', backgroundColor: 'rgba(43,143,212,0.08)' } : {}"
          >
            <span class="w-5 h-5 rounded-full border-2 grid place-items-center shrink-0"
              :class="[store.selectedServiceIds.includes(service.id) ? 'border-brand-500' : 'border-brand-200']">
              <span v-if="store.selectedServiceIds.includes(service.id)" class="w-2.5 h-2.5 rounded-full bg-brand-500" />
            </span>
            <div class="flex-grow min-w-0">
              <div class="font-bold text-brand-700">{{ localeStore.t(service.name) }}</div>
              <div class="text-xs text-brand-500 mt-0.5">{{ localeStore.t(service.description) }}</div>
            </div>
            <div class="font-mono font-bold text-brand-500">{{ localeStore.formatPrice(getMatrixDetails(service.id)?.price || 0) }}</div>
          </button>
        </div>

        <!-- Addons matrix -->
        <div class="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">{{ localeStore.t('addon') }}</div>
        <div class="flex flex-wrap gap-2 mb-6">
          <button 
            v-for="service in addonServices" 
            :key="service.id"
            @click="toggleAddon(service.id)"
            class="glass-card rounded-full px-3 py-2 text-xs font-bold transition-all duration-200 border border-brand-100 hover:border-brand-200 hover:scale-105"
            :class="[
              store.selectedServiceIds.includes(service.id) 
                ? 'text-brand-600' 
                : 'text-brand-500'
            ]"
            :style="store.selectedServiceIds.includes(service.id) ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.1)', boxShadow: '0 0 14px rgba(43,143,212,0.3)' } : {}"
          >
            {{ localeStore.t(service.name) }} <span class="opacity-60 ml-1">+{{ localeStore.formatPrice(getMatrixDetails(service.id)?.price || 0) }}</span>
          </button>
        </div>

        <!-- Total summary panel -->
        <div class="glass-card rounded-xl p-4 flex items-center justify-between border border-brand-200">
          <span class="text-sm text-brand-500">
            {{ localeStore.t('selected') || 'Selected' }}: <span class="text-brand-700 font-semibold">{{ store.selectedServiceIds.length }}</span>
          </span>
          <span class="font-bold text-lg text-brand-700">
            {{ localeStore.t('price') }}: <span class="text-brand-500 font-mono font-bold">{{ localeStore.formatPrice(store.selectedDetails.price) }}</span>
          </span>
        </div>
      </div>

      <!-- STEP 4: DATE, TIME & DETAILS -->
      <div v-else-if="currentStep === 4" class="space-y-6 anim-slide-right">
        <h2 class="text-xl font-bold text-brand-700 font-serif-brand">{{ localeStore.t('bookSlot') || 'დაჯავშნეთ სასურველი დრო' }}</h2>
        
        <!-- Premium Custom Calendar Date Picker -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-brand-500 uppercase tracking-wider block">{{ localeStore.t('date') }}</label>
          
          <div class="glass-card rounded-2xl p-4.5 space-y-4 border border-brand-200">
            <!-- Calendar Navigation Header -->
            <div class="flex justify-between items-center px-1">
              <button 
                type="button"
                @click="prevMonth" 
                class="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-100/40 border border-brand-200 hover:bg-brand-100 text-brand-600 disabled:opacity-20 disabled:cursor-not-allowed transition text-xs"
                :disabled="calendarYear === new Date().getFullYear() && calendarMonth === new Date().getMonth()"
              >
                ◀
              </button>
              <span class="text-xs font-extrabold text-brand-700 tracking-wider uppercase">{{ currentMonthName }}</span>
              <button 
                type="button"
                @click="nextMonth" 
                class="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-100/40 border border-brand-200 hover:bg-brand-100 text-brand-600 transition text-xs"
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
                  class="text-[9px] font-black text-brand-500 uppercase tracking-wider py-1"
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
                        ? 'border border-brand-400/50 text-brand-500 bg-brand-500/5 font-extrabold'
                        : day.isCurrentMonth
                          ? 'text-brand-700 hover:bg-brand-100/30'
                          : 'text-brand-400 hover:bg-brand-100/30',
                    (day.isPast || isNonWorkingDay(day)) ? 'line-through text-brand-300' : ''
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
            <label class="text-xs font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('time') }}</label>
          </div>

          <div v-if="store.loadingSlots" class="text-center py-8">
            <div class="inline-block animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2"></div>
            <p class="text-xs text-brand-500 font-bold">{{ localeStore.t('syncing_calendar') }}</p>
          </div>

          <div v-else-if="store.availableSlots.length === 0" class="text-center py-8 glass-card border border-brand-200 rounded-xl">
            <span class="text-xl">💤</span>
            <p class="text-xs text-brand-400 font-bold mt-2">No slots available on this date.</p>
          </div>

          <div v-else class="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
            <button 
              v-for="slot in store.availableSlots" 
              :key="slot"
              @click="store.selectedStartTime = slot"
              class="px-3 py-2 rounded-lg text-sm font-mono transition-all border duration-150"
              :class="[
                store.selectedStartTime === slot
                  ? 'bg-brand-500 border-brand-500 text-white font-bold'
                  : 'glass-card border-brand-100 text-brand-600 hover:scale-105'
              ]"
            >
              {{ formatSlotTime(slot) }}
            </button>
          </div>
        </div>

        <!-- Details and Notes section -->
        <div v-show="store.selectedStartTime" class="space-y-4">
          <div class="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">
            {{ localeStore.t('details') || 'დეტალები' }}
          </div>
          <!-- Comments / Note textarea -->
          <textarea 
            rows="2"
            :placeholder="localeStore.t('note') || 'შენიშვნა'"
            v-model="store.notes"
            class="w-full glass-input rounded-lg px-4 py-3 outline-none focus:ring-cyan-focus resize-none"
          ></textarea>

          <!-- Payment selector -->
          <div class="grid grid-cols-2 gap-3">
            <button 
              type="button"
              @click="store.paymentMethod = 'on_site'"
              class="relative glass-card rounded-xl p-4 flex flex-col items-center gap-2.5 transition-all hover:scale-[1.02] duration-200 border border-brand-100 hover:border-brand-200"
              :class="[
                store.paymentMethod === 'on_site' 
                  ? 'text-brand-600' 
                  : 'text-brand-500/70'
              ]"
              :style="store.paymentMethod === 'on_site' ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.1)', boxShadow: '0 0 20px rgba(43,143,212,0.25)' } : {}"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500">
                <rect width="20" height="12" x="2" y="6" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              <span class="text-xs font-semibold text-center text-brand-700">{{ localeStore.t('pay_on_site') }}</span>
            </button>
            <button 
              type="button"
              @click="store.paymentMethod = 'card_online'"
              class="relative glass-card rounded-xl p-4 flex flex-col items-center gap-2.5 transition-all hover:scale-[1.02] duration-200 border border-brand-100 hover:border-brand-200"
              :class="[
                store.paymentMethod === 'card_online' 
                  ? 'text-brand-600' 
                  : 'text-brand-500/70'
              ]"
              :style="store.paymentMethod === 'card_online' ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.1)', boxShadow: '0 0 20px rgba(43,143,212,0.25)' } : {}"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span class="text-xs font-semibold text-center text-brand-700">{{ localeStore.t('pay_card') }}</span>
            </button>
          </div>

          <!-- Card Input details -->
          <div v-if="store.paymentMethod === 'card_online'" class="anim-expand mt-3">
            <div class="glass-card rounded-xl p-4 space-y-3 border border-brand-200">
              <!-- Card Number Input -->
              <div class="relative glass-input rounded-lg focus-within:ring-cyan-focus">
                <input 
                  type="text" 
                  :placeholder="localeStore.t('card_number')"
                  v-model="store.cardNumber"
                  @input="handleCardNumberInput"
                  class="w-full bg-transparent outline-none px-4 py-3 font-mono pr-14 text-brand-700 text-xs tracking-wider font-bold"
                />
                <span v-if="detectedCardBrand" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-brand-500 glass-card px-2 py-1 rounded">
                  {{ detectedCardBrand }}
                </span>
              </div>
              <!-- Expiry & CVV -->
              <div class="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  v-model="cardExpiry"
                  @input="handleCardExpiryInput"
                  class="glass-input rounded-lg px-4 py-3 outline-none focus:ring-cyan-focus font-mono text-brand-700 text-xs"
                  maxlength="5"
                />
                <input 
                  type="text" 
                  placeholder="CVV"
                  v-model="cardCvv"
                  @input="cardCvv = cardCvv.replace(/\D/g, '').slice(0, 4)"
                  class="glass-input rounded-lg px-4 py-3 outline-none focus:ring-cyan-focus font-mono text-brand-700 text-xs"
                  maxlength="4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 5: SUCCESS SCREEN -->
      <div v-else-if="currentStep === 5" class="space-y-6 text-center py-6 anim-slide-right">
        <div class="flex justify-center mb-5">
          <div class="w-20 h-20 rounded-full grid place-items-center anim-pulse-glow"
            style="background: linear-gradient(135deg, rgb(34,197,124), rgb(20,160,100))">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div>
          <h3 class="text-2xl font-black text-brand-700 font-serif-brand">{{ localeStore.t('success_title') }}</h3>
          <p class="text-xs text-brand-505 mt-2 max-w-[280px] mx-auto leading-relaxed">
            {{ localeStore.t('success_desc') }}
          </p>
        </div>

        <div class="flex justify-center my-6">
          <button 
            @click="copyConfirmedRef"
            class="glass-card rounded-full px-4 py-2 inline-flex items-center gap-2 font-mono text-sm hover:text-brand-500 transition-colors border"
          >
            {{ confirmedBookingId }}
            <span v-if="refCopied" class="text-emerald-500">✓</span>
            <span v-else>📋</span>
          </button>
        </div>

        <!-- Success summary rows -->
        <div v-if="confirmedBooking" class="space-y-3 text-left max-w-md mx-auto mb-6">
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('branch') }}</span>
            <span class="ml-auto text-sm font-bold text-brand-700 text-right">{{ confirmedBooking.branch?.name ? localeStore.t(confirmedBooking.branch.name) : localeStore.t(confirmedBranchName) }}</span>
          </div>
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" x2="12" y1="22.08" y2="12" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('bays_assigned') }}</span>
            <span class="ml-auto text-sm font-bold text-brand-700 text-right">#{{ getBayName(confirmedBooking.washingBayId) }}</span>
          </div>
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('step_vehicle') }}</span>
            <span class="ml-auto text-sm font-bold text-brand-700 text-right">{{ confirmedBooking.vehicleType?.name ? localeStore.t(confirmedBooking.vehicleType.name) : '' }}</span>
          </div>
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('step_datetime') }}</span>
            <span class="ml-auto text-sm font-bold text-brand-700 text-right">{{ formatDateSuccess(confirmedBooking.startTime) }}</span>
          </div>
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('step_services') }}</span>
            <span class="ml-auto text-xs font-bold text-brand-700 text-right max-w-[220px] truncate leading-tight">
              {{ confirmedBooking.bookingServices?.map(bs => localeStore.t(bs.service?.name)).join(', ') }}
            </span>
          </div>
          <div class="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border">
            <span class="text-brand-500/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v12M16 8h-4a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4h-4" />
              </svg>
            </span>
            <span class="text-xs text-brand-500 uppercase tracking-wider min-w-[85px]">{{ localeStore.t('price') }}</span>
            <span class="ml-auto text-sm font-bold text-brand-500 font-mono text-right">{{ localeStore.formatPrice(confirmedBooking.totalPrice) }}</span>
          </div>
        </div>

        <button 
          @click="startNewBooking"
          class="w-full glass-card rounded-xl py-3 font-semibold text-sm hover:border-brand-500/50 hover:text-brand-500 transition-all border"
        >
          {{ localeStore.t('book_another') }}
        </button>
      </div>

      <!-- FOOTER ACTION BUTTONS -->
      <div v-if="currentStep < 5" class="mt-8 pt-4 border-t border-brand-200/20 flex justify-end items-center">

        <div class="flex gap-2">
          <button 
            v-if="currentStep > 1" 
            @click="prevStep" 
            class="glass-card rounded-xl px-5 py-3 text-sm font-semibold flex items-center gap-2.5 hover:text-brand-500 transition-colors border"
          >
            <span>◀</span>
            <span>{{ localeStore.t('back') }}</span>
          </button>
          
          <button 
            v-if="currentStep < 4" 
            @click="nextStep"
            :disabled="!canProceed"
            class="glass-card rounded-xl px-5 py-3 text-sm font-semibold flex items-center gap-2.5 hover:text-brand-500 transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{{ currentStep === 1 ? 'შემდეგი: ავტომობილი' : currentStep === 2 ? 'შემდეგი: სერვისები' : 'შემდეგი: გადახდა' }}</span>
            <span>▶</span>
          </button>

          <button 
            v-else-if="currentStep === 4" 
            @click="submitBookingOrder"
            :disabled="submittingBooking || !canProceed"
            class="glass-card rounded-xl px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 hover:text-brand-500 transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="submittingBooking" class="animate-spin h-3.5 w-3.5 border-2 border-brand-500 border-t-transparent rounded-full shrink-0"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {{ localeStore.t('confirm_and_book') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Personal Cabinet Modal -->
    <div 
      v-if="showCabinet" 
      class="fixed inset-0 z-50 grid place-items-center px-4 py-8 anim-slide-right"
      style="background: rgba(5,8,15,0.7); backdrop-filter: blur(8px);"
      @click.self="showCabinet = false"
    >
      <div class="glass-strong rounded-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col overflow-hidden border border-brand-200 bg-white">
        <!-- Header -->
        <div class="p-5 flex items-center gap-3 border-b border-brand-200/50 shrink-0">
          <span class="w-12 h-12 rounded-full grid place-items-center font-bold text-lg bg-brand-gradient text-white shrink-0">
            {{ customerAuth.customer?.name.trim().charAt(0).toUpperCase() }}
          </span>
          <div class="flex-grow min-w-0">
            <div class="font-bold text-brand-700 truncate text-base">{{ customerAuth.customer?.name }}</div>
            <div class="text-xs text-brand-500 font-mono mt-0.5">+995 {{ customerAuth.customer?.phoneNumber }}</div>
          </div>
          <button @click="showCabinet = false" class="glass-card rounded-full p-2 hover:text-brand-500 transition-colors">
            ✕
          </button>
        </div>

        <!-- History Title -->
        <div class="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-brand-500 shrink-0">
          {{ localeStore.locale === 'ka' ? 'ჯავშნების ისტორია' : 'Booking History' }}
        </div>

        <!-- Scrollable bookings list -->
        <div class="flex-grow overflow-y-auto p-5 space-y-3">
          <div v-if="customerAuth.customerBookings.length === 0" class="text-center py-10 bg-brand-100/40 rounded-xl border border-brand-100">
            <span class="text-2xl">📅</span>
            <p class="text-xs text-brand-505 font-bold mt-2">აქტიური ჯავშნები ვერ მოიძებნა.</p>
          </div>
          <div 
            v-else
            v-for="booking in customerAuth.customerBookings" 
            :key="booking.id"
            class="glass-card rounded-xl p-4 border border-brand-200"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0">
                <div class="font-bold text-brand-700">{{ localeStore.t(booking.branch?.name || 'საბურთალოს ფილიალი') }}</div>
                <div class="text-xs text-brand-500 mt-0.5 font-light">{{ formatDateHuman(booking.startTime) }}</div>
              </div>
              <span
                class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                :class="[
                  booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  booking.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                  booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                ]"
              >
                {{ getStatusLabel(booking.status) }}
              </span>
            </div>
            
            <div class="flex flex-wrap items-center gap-1.5 mb-2">
              <span class="text-[9px] font-mono uppercase glass-card px-1.5 py-0.5 text-brand-500 rounded border">{{ booking.vehicleType?.name ? localeStore.t(booking.vehicleType.name) : 'სედანი' }}</span>
              <span 
                v-for="s in booking.bookingServices" 
                :key="s.serviceId"
                class="text-[9px] glass-card px-1.5 py-0.5 text-brand-600 rounded border"
              >
                {{ s.service?.name ? localeStore.t(s.service.name) : 'რეცხვა' }}
              </span>
            </div>

            <div class="text-right font-mono font-bold text-brand-500">{{ localeStore.formatPrice(booking.totalPrice) }}</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-brand-200/50 shrink-0">
          <button 
            type="button" 
            @click="handleLogout" 
            class="w-full glass-card rounded-xl py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all border border-rose-300"
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
const confirmedBooking = ref(null)
const showCabinet = ref(false)
const showPwd = ref(false)

const cardExpiry = ref('')
const cardCvv = ref('')
const refCopied = ref(false)

function copyConfirmedRef() {
  if (typeof navigator !== 'undefined' && confirmedBookingId.value) {
    navigator.clipboard.writeText(confirmedBookingId.value)
    refCopied.value = true
    setTimeout(() => {
      refCopied.value = false
    }, 1600)
  }
}

// Password Strength meter
const passwordStrength = computed(() => {
  const p = signupForm.value.password
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p) && /[^\w\s]/.test(p)) s++
  
  const palette = [
    { score: 0, color: "rgb(244,63,94)", label: localeStore.locale === 'ka' ? "სუსტი" : "Weak" },
    { score: 1, color: "rgb(245,158,11)", label: localeStore.locale === 'ka' ? "საშუალო" : "Fair" },
    { score: 2, color: "rgb(26,111,171)", label: localeStore.locale === 'ka' ? "კარგი" : "Good" },
    { score: 3, color: "rgb(34,197,124)", label: localeStore.locale === 'ka' ? "ძლიერი" : "Strong" },
    { score: 4, color: "rgb(43,143,212)", label: localeStore.locale === 'ka' ? "შესანიშნავი" : "Excellent" },
  ]
  return palette[s]
})

// Visa / Mastercard detector
const detectedCardBrand = computed(() => {
  const num = store.cardNumber.replace(/\s/g, "")
  if (/^4/.test(num)) return "VISA"
  if (/^(5[1-5]|2[2-7])/.test(num)) return "MC"
  if (/^3[47]/.test(num)) return "AMEX"
  return ""
})

function handleCardNumberInput(e) {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 19)
  const grouped = digits.replace(/(.{4})/g, "$1 ").trim()
  store.cardNumber = grouped
}

function handleCardExpiryInput(e) {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
  cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

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

  // Set up listeners for layouts event emission
  if (typeof window !== 'undefined') {
    window.addEventListener('splendor:open-cabinet', () => {
      showCabinet.value = true
    })
    window.addEventListener('splendor:open-auth', () => {
      // Focus login by setting tab
      authMode.value = 'login'
    })
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

// No default vehicle selection - user must select explicitly

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

async function submitBookingOrder() {
  submittingBooking.value = true
  store.error = null

  // Capture selected branch name before submit resets choices
  const selectedBranch = store.branches.find(b => b.id === store.selectedBranchId)
  confirmedBranchName.value = selectedBranch ? selectedBranch.name : ''

  const result = await store.submitBooking()
  submittingBooking.value = false

  if (result.success) {
    confirmedBooking.value = result.booking
    confirmedBookingId.value = result.booking.bookingId
    currentStep.value = 5
    customerAuth.fetchMyBookings()
  }
}

function startNewBooking() {
  store.resetChoices()
  currentStep.value = 1
  confirmedBooking.value = null
  store.loadServiceGrid()
}

function formatSlotTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateHuman(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' @ ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateSuccess(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  const dateStr = date.toLocaleDateString(localeStore.locale === 'ka' ? 'ka-GE' : 'en-US', options)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${dateStr} · ${timeStr}`
}

function getBayName(washingBayId) {
  const bay = store.washingBays.find(b => b.id === washingBayId)
  return bay ? bay.name : '1'
}

function canGoToStep(stepNum) {
  if (stepNum === 1) return true
  if (stepNum === 2) return !!store.selectedBranchId
  if (stepNum === 3) return !!store.selectedBranchId && !!store.selectedVehicleTypeId
  if (stepNum === 4) {
    // Must select at least one base package
    const hasBasePkg = store.selectedServiceIds.some(id => {
      const s = store.services.find(x => x.id === id)
      return s && !s.isAddon
    })
    return !!store.selectedBranchId && !!store.selectedVehicleTypeId && hasBasePkg
  }
  return false
}

function goToStep(stepNum) {
  if (canGoToStep(stepNum)) {
    currentStep.value = stepNum
  }
}
</script>
