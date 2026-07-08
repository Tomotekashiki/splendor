<template>
  <div class="w-full max-w-3xl mx-auto py-6 px-4">
    <!-- Booking Disabled Overlay Banner -->
    <div 
      v-if="settingsStore.bookingDisabled" 
      class="max-w-xl mx-auto py-12 px-6 text-center glass-panel rounded-2xl border border-brand-100 shadow-glass space-y-6 animate-in fade-in duration-300"
    >
      <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 grid place-items-center text-rose-500 text-4xl shadow-lg shadow-rose-500/5">
        🔒
      </div>
      <div class="space-y-2">
        <h3 class="text-xl font-black text-[#0C447C] tracking-wide">
          {{ localeStore.t('disable_booking') }}
        </h3>
        <p class="text-brand-500 text-sm font-semibold max-w-md mx-auto leading-relaxed">
          {{ localeStore.t('booking_system_disabled_msg') }}
        </p>
      </div>
    </div>

    <!-- Active Booking Flow -->
    <template v-else>
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
              <span class="text-xs font-medium truncate transition-colors" :class="[currentStep === stepNum ? 'text-brand-700 font-bold' : 'text-brand-500 group-hover:text-brand-700']">
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
              :style="{ height: '1px', backgroundColor: currentStep > stepNum ? 'rgb(43, 143, 212)' : 'rgba(12, 68, 124, 0.08)' }"
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
            <h4 class="font-semibold leading-none mb-1">{{ localeStore.locale === 'ka' ? 'შეცდომა' : 'Error' }}</h4>
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
              {{ localeStore.t('forgotPassword') }}
            </button>
          </div>
          
          <button 
            type="button"
            @click="submitLogin"
            :disabled="customerAuth.loading || !loginForm.phoneNumber || !loginForm.password"
            class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            {{ localeStore.t('signIn') }}
          </button>
        </div>

        <!-- TAB 2: SIGN UP FORM -->
        <div v-else-if="authMode === 'signup'" class="space-y-4">
          <!-- Full Name field -->
          <div class="relative glass-input rounded-xl">
            <input 
              type="text" 
              :placeholder="localeStore.t('fullNamePlaceholder')"
              v-model="signupForm.name"
              :disabled="signupForm.otpSent"
              class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
              :disabled="signupForm.otpSent"
              @input="signupForm.phoneNumber = signupForm.phoneNumber.replace(/\D/g, '').slice(0, 9)"
              class="flex-grow bg-transparent outline-none px-3.5 py-3.5 font-mono text-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          <!-- Password field -->
          <div class="relative glass-input rounded-xl flex items-center">
            <input 
              :type="showPwd ? 'text' : 'password'" 
              :placeholder="localeStore.t('passwordPlaceholder')"
              v-model="signupForm.password"
              :disabled="signupForm.otpSent"
              class="w-full bg-transparent outline-none px-3.5 py-3.5 text-brand-700 pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
            <button
              type="button"
              @click="showPwd = !showPwd"
              :disabled="signupForm.otpSent"
              class="absolute right-3.5 text-brand-400 hover:text-brand-600 focus:outline-none disabled:opacity-50"
            >
              <span v-if="showPwd">👁️</span>
              <span v-else>🙈</span>
            </button>
          </div>

          <!-- Password strength bar -->
          <div v-if="signupForm.password && !signupForm.otpSent" class="space-y-1">
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

          <!-- OTP Sent Info and Input -->
          <template v-if="signupForm.otpSent">
            <div class="p-3 bg-brand-100/50 border border-brand-200 text-brand-700 rounded-xl text-xs font-semibold text-center">
              {{ localeStore.locale === 'ka' ? 'SMS კოდი გაეგზავნა ნომერს:' : 'SMS code was sent to:' }} <span class="font-extrabold text-brand-900">+995 {{ signupForm.phoneNumber }}</span>
            </div>
            
            <div class="flex justify-center gap-3 py-2">
              <input 
                type="text" 
                placeholder="0000"
                v-model="signupForm.otpCode"
                @input="signupForm.otpCode = signupForm.otpCode.replace(/\D/g, '').slice(0, 4)"
                class="w-32 h-14 text-center text-2xl font-mono glass-input rounded-xl focus:ring-cyan-focus font-bold tracking-widest"
                required
              />
            </div>

            <button 
              type="button"
              @click="submitRegister"
              :disabled="customerAuth.loading || !signupForm.otpCode || signupForm.otpCode.length < 4"
              class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              {{ localeStore.locale === 'ka' ? 'რეგისტრაცია და შესვლა' : 'Register & Sign In' }}
            </button>

            <div class="text-center pt-2">
              <button 
                type="button" 
                @click="signupForm.otpSent = false"
                class="text-xs font-bold text-brand-500 hover:text-brand-700 transition"
              >
                {{ localeStore.locale === 'ka' ? 'მონაცემების შეცვლა' : 'Change Details' }}
              </button>
            </div>
          </template>

          <template v-else>
            <button 
              type="button"
              @click="sendSignupOtp"
              :disabled="customerAuth.loading || signupForm.sendingOtp || !signupForm.name || !signupForm.password || signupForm.password.length < 6 || !signupForm.phoneNumber || signupForm.phoneNumber.length < 9"
              class="w-full py-3 bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="customerAuth.loading || signupForm.sendingOtp" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              {{ localeStore.locale === 'ka' ? 'SMS კოდის გაგზავნა' : 'Send SMS Code' }}
            </button>
          </template>
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
              {{ localeStore.locale === 'ka' ? 'OTP კოდის გაგზავნა' : 'Send OTP Code' }}
            </button>
          </div>

          <div v-else-if="forgotForm.forgotStep === 2" class="space-y-4 text-center">
            <div class="p-3 bg-brand-100/50 border border-brand-200 text-brand-700 rounded-xl text-xs font-semibold">
              {{ localeStore.locale === 'ka' ? 'SMS კოდი გაეგზავნა ნომერს:' : 'SMS code was sent to:' }} <span class="font-extrabold text-brand-900">+995 {{ forgotForm.phoneNumber }}</span>
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
              {{ localeStore.locale === 'ka' ? 'კოდის დადასტურება' : 'Verify Code' }}
            </button>
          </div>

          <div v-else-if="forgotForm.forgotStep === 3" class="space-y-4">
            <div class="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold text-center">
              {{ localeStore.locale === 'ka' ? 'კოდი წარმატებით დადასტურდა. შეიყვანეთ ახალი პაროლი.' : 'Code verified successfully. Enter new password.' }}
            </div>

            <div class="relative glass-input rounded-xl">
              <input 
                type="password" 
                :placeholder="localeStore.locale === 'ka' ? 'ახალი პაროლი' : 'New Password'"
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
              {{ localeStore.locale === 'ka' ? 'პაროლის განახლება' : 'Update Password' }}
            </button>
          </div>

          <div class="text-center pt-2">
            <button 
              type="button" 
              @click="cancelForgot"
              class="text-xs font-bold text-brand-500 hover:text-brand-700 transition"
            >
              {{ localeStore.locale === 'ka' ? 'ავტორიზაციაზე დაბრუნება' : 'Back to Sign In' }}
            </button>
          </div>
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
        
        <!-- If user is logged in and has saved cars -->
        <div v-if="customerAuth.isAuthenticated && customerAuth.savedCars && customerAuth.savedCars.length > 0" class="mb-4 space-y-2 bg-slate-50/50 p-4 rounded-xl border border-brand-100">
          <div class="text-[10px] font-black text-brand-500 uppercase tracking-wider">
            {{ localeStore.locale === 'ka' ? 'აირჩიეთ თქვენი ავტომობილი' : 'Select Your Saved Car' }}
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              v-for="car in customerAuth.savedCars" 
              :key="car.id"
              type="button"
              @click="selectSavedCarForBooking(car)"
              class="glass-card rounded-lg p-3 flex items-center justify-between text-left border transition-all hover:scale-[1.01] duration-150"
              :class="{ 'scale-[1.01]': selectedCarId === car.id }"
              :style="selectedCarId === car.id ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.12)', boxShadow: '0 0 20px rgba(43,143,212,0.25)' } : {}"
            >
              <div class="min-w-0">
                <div class="font-bold text-brand-700 text-xs truncate">{{ car.make }} {{ car.model }}</div>
                <div class="text-[10px] text-brand-400 font-mono mt-0.5 tracking-wider">{{ car.licensePlate }}</div>
              </div>
              <span class="text-[9px] shrink-0 bg-brand-100/50 text-brand-600 px-2 py-0.5 rounded font-black uppercase">
                {{ getAutoDeterminedCategoryLabel(car) }}
              </span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3.5">
          <button 
            v-for="vehicle in store.vehicleTypes" 
            :key="vehicle.id"
            @click="selectVehicle(vehicle.id)"
            class="relative glass-card rounded-xl p-5 flex flex-col items-center gap-3.5 transition-all hover:scale-[1.02] duration-200 border border-brand-100 hover:border-brand-200"
            :class="{ 'scale-[1.03]': store.selectedVehicleTypeId === vehicle.id }"
            :style="store.selectedVehicleTypeId === vehicle.id ? { borderColor: 'rgba(43,143,212,0.7)', backgroundColor: 'rgba(43,143,212,0.12)', boxShadow: '0 0 28px rgba(43,143,212,0.25)' } : {}"
          >
            <!-- Custom SVG Vehicle Icons mapped by ID or Name -->
            <div v-if="vehicle.id === 'v-sedan' || vehicle.name === 'Sedan' || vehicle.name === 'სედანი'" class="w-full flex justify-center">
              <svg width="80" height="34" viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-brand-500 transition-colors duration-300">
                <g clip-path="url(#clip0_13_34)">
                  <path d="M9.54588 27.7139C6.59356 27.8716 3.77354 27.3928 0.974316 26.7852C0.0595122 26.5871 -0.116266 25.8545 0.197489 24.8874C0.42241 24.1932 0.539595 23.4183 0.499903 22.6915C0.42052 21.2551 0.22773 19.8226 0.0254906 18.3978C-0.0916951 17.5691 0.199379 16.9999 0.811768 16.4846C3.24621 14.4368 6.10969 13.3081 9.09793 12.4563C12.4793 11.4911 15.9438 10.9834 19.4481 10.9757C21.7237 10.97 23.7046 10.5123 25.5833 9.06638C27.4545 7.62618 29.5714 6.5071 31.6278 5.33034C34.9733 3.4152 38.5834 2.39226 42.4183 2.1596C48.3948 1.79619 54.3316 1.93079 60.0775 3.87668C62.3418 4.64389 64.6042 5.49954 66.7287 6.59171C69.6224 8.07805 72.6617 8.83756 75.8408 9.2029C76.4948 9.27789 77.1469 9.40287 77.7895 9.55093C78.4321 9.69706 78.676 10.0201 78.5437 10.7969C78.1808 12.9236 78.538 15.0021 79.3734 16.973C80.4167 19.4342 80.103 21.8089 78.8461 24.0317C78.4699 24.6951 77.6062 25.2469 76.8558 25.4796C74.943 26.0699 72.9698 26.4525 70.8472 26.9582C71.4747 23.7837 70.834 21.1321 68.5942 19.0708C67.1029 17.6979 65.2884 16.9038 63.2358 17.0884C60.7598 17.3114 58.7298 18.419 57.3349 20.5879C55.9382 22.7607 55.8758 25.0893 56.6432 27.6293H23.5741C24.712 23.6568 23.7537 20.3168 20.1625 18.0844C17.6147 16.5 14.9213 16.7096 12.4925 18.3921C9.217 20.661 8.40426 23.8836 9.54588 27.7178V27.7139ZM5.18166 15.5424C5.20623 15.6674 5.23269 15.7905 5.25726 15.9155C6.28736 15.8174 7.31935 15.7405 8.34567 15.6174C12.6211 15.1002 16.8813 14.3426 21.1699 14.083C33.172 13.36 45.1873 12.8428 57.197 12.239C58.7053 12.164 60.2192 12.1217 61.7143 11.9314C62.8597 11.7872 63.8879 10.4643 64.0863 9.12791C64.2621 7.94922 63.3813 7.51851 62.6045 7.0378C62.2303 6.80706 61.8239 6.62439 61.4175 6.45326C55.7983 4.1055 49.9277 3.50365 43.9191 3.84592C40.0746 4.06512 36.3398 4.78041 32.9414 6.67823C30.5202 8.0319 28.186 9.5567 25.8838 11.1123C24.5041 12.0448 23.1111 12.5505 21.4232 12.639C18.3518 12.7967 15.2672 13.0774 12.2393 13.6023C9.84829 14.0176 7.53293 14.8771 5.18355 15.5405L5.18166 15.5424ZM53.2712 22.7146C52.8195 22.68 52.5511 22.63 52.2884 22.6415C46.1551 22.9049 40.0217 23.1722 33.8903 23.4491C32.382 23.5164 30.8718 23.5991 29.3673 23.7202C28.6018 23.7817 28.065 24.2067 27.7928 25.0854C28.1954 25.0854 28.5035 25.0969 28.8097 25.0854C33.276 24.8912 37.7423 24.697 42.2085 24.4932C45.1646 24.3586 48.1189 24.1971 51.075 24.0798C51.9746 24.0432 52.604 23.6183 53.2731 22.7165L53.2712 22.7146ZM74.5593 12.5794C73.964 12.5794 73.3667 12.5563 72.7713 12.5851C72.0795 12.6198 71.8112 13.0678 72.2383 13.5715C73.2949 14.8233 74.4705 15.9174 76.2623 15.8924C77.4039 15.877 77.4795 15.7982 77.2225 14.6983C76.8886 13.2754 76.0009 12.5685 74.5593 12.5775V12.5794ZM8.77094 17.123C8.73881 17.0346 8.70857 16.9461 8.67644 16.8577C6.59923 17.1384 4.51824 17.3903 2.45237 17.746C2.21989 17.7864 1.93826 18.419 1.95338 18.7651C1.96661 19.0304 2.40323 19.4842 2.66406 19.4938C3.66392 19.5265 4.677 19.4708 5.67119 19.3439C7.07742 19.1631 7.99411 18.2248 8.76905 17.1268L8.77094 17.123ZM2.37109 25.2315C3.33882 25.3277 4.32545 25.4488 5.31397 25.5123C5.91123 25.5507 5.95282 25.1892 5.80728 24.6855C5.25537 22.7896 4.37837 22.1935 2.37109 22.3992V25.2315ZM41.1973 16.2327C41.1973 16.2193 41.1973 16.2058 41.1973 16.1924C41.7001 16.1654 42.2161 16.2 42.6981 16.0866C42.9438 16.0289 43.3313 15.6674 43.2991 15.5194C43.2424 15.2482 42.9343 14.8406 42.7113 14.8291C41.7417 14.7772 40.7626 14.8041 39.7968 14.9041C39.5662 14.9291 39.3734 15.3463 39.1636 15.5847C39.4018 15.8001 39.6097 16.1327 39.8837 16.2039C40.2977 16.3096 40.757 16.2308 41.1955 16.2308L41.1973 16.2327ZM57.1384 15.4348C57.1384 15.4098 57.1384 15.3828 57.1384 15.3579C57.6411 15.3579 58.1628 15.4367 58.641 15.3252C58.8867 15.2675 59.1683 14.8945 59.2175 14.6233C59.2458 14.4657 58.8527 14.0619 58.6391 14.0542C57.6657 14.0234 56.6866 14.0542 55.7189 14.1561C55.5072 14.1772 55.1878 14.5695 55.184 14.7964C55.1802 15.006 55.5034 15.3579 55.7321 15.4059C56.1839 15.504 56.6696 15.4348 57.1403 15.4348H57.1384Z" fill="currentColor"/>
                  <path d="M57.5296 24.6508C57.4956 21.234 60.2343 18.4728 63.6686 18.4594C66.9347 18.4459 69.6999 21.2955 69.7075 24.6874C69.7169 28.1561 66.9612 30.9731 63.5344 31C60.2551 31.025 57.5636 28.1792 57.5277 24.6508H57.5296ZM67.0538 26.7967C68.2559 25.0219 67.7342 22.653 65.9594 21.234C64.3736 19.9668 61.9713 20.2207 60.584 21.8012C59.2912 23.2741 59.1154 25.5584 60.2816 26.7217C60.8562 26.091 61.427 25.4623 62.0942 24.7297C61.5328 24.5124 61.2172 24.3913 60.9072 24.2701C61.0811 22.7915 62.0828 21.8627 63.5477 21.8108C64.9841 21.7589 66.0067 22.6723 66.2788 24.2528C65.1901 24.5201 65.0711 24.8681 66.2788 24.2528C65.1901 24.5201 65.0711 24.8681 65.829 25.6795C66.1919 26.068 66.6134 26.3968 67.0557 26.7948L67.0538 26.7967ZM65.2846 28.3946C64.9577 27.7408 64.6798 27.1332 64.3566 26.5525C63.8822 25.7007 63.2925 25.6699 62.8086 26.4929C62.459 27.0871 62.1906 27.7312 61.8957 28.335C62.8313 29.1022 64.196 29.1195 65.2846 28.3946Z" fill="currentColor"/>
                  <path d="M10.4777 24.7143C10.4947 21.3417 13.3147 18.492 16.6526 18.4728C19.8525 18.4536 22.6839 21.3859 22.6347 24.6701C22.5837 28.1869 19.913 31.0288 16.6885 31.0019C13.241 30.9731 10.4588 28.1581 10.4758 24.7162L10.4777 24.7143ZM19.7864 27.0217C21.2266 25.2661 20.6823 22.6838 19.1626 21.407C17.471 19.9841 15.1273 20.1284 13.551 21.8108C12.2317 23.2183 12.0332 25.4969 13.1805 26.7063C13.5321 26.4025 13.9063 26.1122 14.2408 25.7834C15.2237 24.8162 15.1764 24.6124 13.9139 24.1932C14.014 22.6107 15.4675 21.7224 16.6942 21.7974C18.1004 21.882 19.1116 22.8299 19.2023 24.2278C18.021 24.6105 17.9832 24.797 18.8186 25.7257C19.1551 26.1006 19.4273 26.5352 19.7845 27.0198L19.7864 27.0217ZM18.3575 28.7022C17.8585 27.6927 17.5391 26.964 17.1497 26.2775C16.8378 25.7238 16.3445 25.7103 16.0138 26.2141C15.5545 26.914 15.2067 27.6889 14.668 28.7022H18.3556H18.3575Z" fill="currentColor"/>
                  <path d="M47.2797 11.2988C47.5707 9.36441 47.8448 7.63002 48.0867 5.89179C48.1623 5.34763 48.4496 5.23611 48.9297 5.25342C53.3034 5.41686 57.5655 6.10523 61.565 8.02228C62.0451 8.25109 62.7368 8.32609 62.58 9.16059C62.4287 9.96433 61.6746 10.6604 60.8808 10.6931C57.6733 10.8315 54.4658 10.9565 51.2602 11.093C49.9787 11.1488 48.6991 11.2238 47.2816 11.2968L47.2797 11.2988Z" fill="currentColor"/>
                  <path d="M31.5862 8.98176C36.0109 6.19175 40.6662 5.21687 45.7033 5.20534C45.1911 7.3589 44.7148 9.36825 44.2215 11.4487C40.6228 11.6314 37.0448 11.8141 33.3006 12.0044C33.6105 10.5623 33.0908 9.54322 31.5881 8.98176H31.5862Z" fill="currentColor"/>
                  <path d="M26.723 12.1314C27.7493 11.4622 28.7114 10.6142 29.8284 10.2008C30.3728 9.99894 31.3065 10.4681 31.8754 10.8931C32.3177 11.2238 31.8811 12.0371 31.2158 12.0987C29.7547 12.2333 28.2861 12.2967 26.8213 12.389C26.7892 12.3025 26.757 12.216 26.723 12.1314Z" fill="currentColor"/>
                </g>
                <defs>
                  <clipPath id="clip0_13_34">
                    <rect width="80" height="34" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div v-else-if="vehicle.id === 'v-suv' || vehicle.name === 'SUV/Jeep' || vehicle.name === 'ჯიპი / SUV'" class="w-full flex justify-center">
              <svg width="80" height="34" viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-brand-500 transition-colors duration-300">
                <path d="M67.7282 21.0521C66.7965 19.2101 66.1556 17.2449 64.6872 15.742C63.7627 14.796 62.5204 14.6103 61.2889 14.5996C58.9265 14.5818 56.5623 14.6282 54.2016 14.7156C52.4747 14.7799 51.2576 15.7473 50.3277 17.1271C49.2111 18.7817 48.0604 20.4131 46.9833 22.091C46.4447 22.9299 45.7877 23.2779 44.768 23.269C39.6823 23.2226 34.5966 23.2244 29.5109 23.2494C28.4823 23.2547 27.7822 22.9674 27.249 22.0249C26.3568 20.447 25.2923 18.9656 24.3642 17.4055C23.0124 15.1333 21.0934 13.9481 18.3935 14.0231C15.8228 14.0945 13.2503 14.082 10.6779 14.1355C10.1788 14.1463 9.68156 14.2873 9.1843 14.3694C9.09813 13.3395 9.85749 12.2435 11.1482 11.9258C12.7674 11.5278 14.4208 11.1976 16.0795 11.0351C20.0343 10.6478 23.9998 10.3497 27.9653 10.0802C28.8808 10.0177 29.432 9.71071 29.8502 8.89143C30.9722 6.6924 32.1893 4.54335 33.3275 2.35146C33.8822 1.28408 34.6541 0.629009 35.8999 0.577246C37.6628 0.504064 39.422 0.355915 41.1849 0.320216C47.468 0.193487 53.7492 0.0756815 60.0305 0.00249948C61.8221 -0.0171347 63.6191 0.0810362 65.4052 0.222045C66.6044 0.316647 66.994 0.670062 67.1789 1.86061C67.651 4.88427 68.0459 7.91865 68.4588 10.9495C68.5306 11.476 68.4516 12.0989 69.4067 11.7902C69.4067 10.7656 69.3959 9.73213 69.4085 8.69866C69.4246 7.44743 69.9344 6.93872 71.2072 6.88339C71.5052 6.8709 71.805 6.8709 72.1048 6.87982C73.3435 6.91552 73.8892 7.32784 73.9682 8.56836C74.119 10.9387 74.198 13.3163 74.2374 15.6938C74.2536 16.6701 74.1244 17.6519 74.0059 18.6246C73.8641 19.7777 73.3237 20.2239 72.173 20.2329C72.0527 20.2329 71.9343 20.2329 71.814 20.2329C69.6993 20.2436 69.5233 20.0579 69.4605 17.9749C69.4533 17.7125 69.1841 17.4555 69.0369 17.1967C68.9076 17.4484 68.6742 17.6965 68.6653 17.9517C68.6222 18.9888 68.6473 20.0276 68.6473 21.186C69.1015 21.2235 69.5305 21.2824 69.9614 21.2913C70.6758 21.3056 70.9505 21.6554 70.9774 22.3516C71.0851 25.1004 69.2218 26.4444 66.5524 25.4734C66.24 25.3592 65.9635 24.9879 65.793 24.672C64.9223 23.0477 64.093 21.402 63.2457 19.7652C62.6335 18.5836 61.648 18.0588 60.3213 18.0927C58.8565 18.1302 57.3898 18.1516 55.925 18.1498C54.6037 18.1498 53.6361 18.7496 52.9342 19.8152C51.6094 21.8286 50.2684 23.8348 48.9992 25.8839C48.5343 26.6354 47.967 26.962 47.1053 26.9602C40.3448 26.9424 33.5842 26.937 26.8236 26.937C26.0624 26.937 25.5311 26.639 25.1307 25.9875C23.8508 23.9098 22.5206 21.8607 21.2478 19.7777C20.3843 18.3623 19.1672 17.5894 17.5031 17.5715C15.8282 17.5537 14.1497 17.5287 12.4784 17.6126C11.8896 17.6411 11.0944 17.8107 10.7802 18.2141C9.72644 19.5671 8.39981 19.0566 7.11627 19.0959C7.12166 17.2467 8.28133 15.6045 9.9257 15.5189C13.1444 15.3493 16.3739 15.3582 19.598 15.3832C20.9749 15.3939 22.0179 16.1793 22.7557 17.3199C24.0967 19.3957 25.4449 21.468 26.7374 23.5742C27.1575 24.2597 27.6206 24.5399 28.4608 24.5327C34.234 24.4828 40.0091 24.4792 45.7823 24.506C46.6709 24.5095 47.2005 24.199 47.6654 23.4582C48.8341 21.5912 50.0907 19.7777 51.306 17.9392C52.1749 16.6255 53.3687 15.9044 54.9753 15.9133C57.3073 15.9276 59.6392 15.9151 61.9711 15.9669C63.2169 15.9937 64.1002 16.6791 64.6872 17.7411C65.1755 18.6264 65.6566 19.5189 66.1036 20.4256C66.4321 21.0932 66.8934 21.3502 67.7336 21.0486L67.7282 21.0521ZM57.6035 10.6032V10.5889C59.6966 10.5889 61.788 10.5996 63.8811 10.5853C65.1072 10.5764 65.5237 10.1802 65.4214 8.95391C65.267 7.12079 65.0426 5.29302 64.7985 3.46883C64.6459 2.33004 64.443 2.17119 63.2852 2.17119C59.2496 2.17119 55.2141 2.18546 51.1786 2.20688C50.1912 2.21224 49.9076 2.46748 49.895 3.49382C49.8717 5.36442 49.8914 7.23681 49.9255 9.10919C49.9489 10.3408 50.2289 10.5943 51.5035 10.6014C53.5356 10.6121 55.5695 10.605 57.6017 10.605L57.6035 10.6032ZM33.0151 7.56702C35.2106 7.67947 34.8067 7.63841 34.8677 9.42691C34.8731 9.57506 34.8767 9.72321 34.8785 9.87314C34.8839 10.3872 35.1424 10.63 35.6594 10.6264C38.9481 10.6032 42.2387 10.605 45.5256 10.53C45.8272 10.5229 46.3586 10.0427 46.3747 9.76248C46.4878 7.62592 46.5201 5.48579 46.5309 3.34567C46.5345 2.61028 46.1234 2.21581 45.3299 2.23187C42.4307 2.29078 39.528 2.29613 36.6306 2.40501C36.1764 2.42286 35.5499 2.76378 35.3255 3.14397C34.4997 4.54335 33.8086 6.02127 33.0151 7.5688V7.56702ZM64.8182 14.2587C64.8128 14.9495 65.4501 15.626 66.0946 15.6153C66.7462 15.6028 67.3709 14.9977 67.3889 14.3604C67.4104 13.6643 66.7947 13.0414 66.0892 13.045C65.364 13.0485 64.8218 13.5662 64.8164 14.2587H64.8182ZM44.6998 13.8732V13.8839C45.1755 13.8839 45.6638 13.9463 46.1216 13.8589C46.3711 13.8107 46.5704 13.5055 46.7912 13.3163C46.5883 13.0985 46.3998 12.713 46.1808 12.6933C45.2366 12.6148 44.2798 12.6041 43.3355 12.6666C43.1147 12.6808 42.9172 13.0735 42.709 13.2913C42.9567 13.4858 43.1775 13.7803 43.4558 13.8482C43.8489 13.9446 44.2816 13.8732 44.698 13.8732H44.6998ZM30.7245 18.8031V20.8719C31.4138 20.7505 32.0278 20.6934 32.6058 20.5167C32.8194 20.4506 33.0941 20.0901 33.0761 19.8866C33.0546 19.6349 32.8051 19.2761 32.5717 19.1922C32.0296 18.9977 31.4372 18.9424 30.7245 18.8031ZM30.6832 14.8567C31.3869 14.7335 31.956 14.6942 32.4748 14.514C32.7225 14.4283 33.0007 14.0927 33.0331 13.8392C33.0564 13.6518 32.7458 13.3038 32.516 13.227C31.947 13.0378 31.3402 12.9629 30.6832 12.8272V14.8549V14.8567Z" fill="currentColor"/>
                <path d="M15.7403 34C11.886 33.9643 8.87914 30.8817 8.90786 26.9942C8.93838 23.1227 12.062 20.1097 16.0041 20.1454C19.7704 20.1793 22.8311 23.3136 22.8096 27.1084C22.7863 30.9781 19.6519 34.0339 15.7385 33.9982L15.7403 34ZM19.1098 29.0129C20.1869 27.2583 19.7937 25.2503 18.2481 24.0187C16.7276 22.8067 14.6308 22.9102 13.1803 24.2686C11.8017 25.5591 11.5216 27.5386 12.5897 29.0183C13.175 28.415 13.744 27.8295 14.4082 27.1441C13.8374 26.946 13.516 26.8353 13.2037 26.7282C13.5717 25.095 14.8373 24.2418 16.3847 24.5256C17.6988 24.7666 18.4384 25.6662 18.2876 26.8407C17.302 27.1084 17.2697 27.2012 17.9645 27.9277C18.3073 28.2864 18.6843 28.6131 19.108 29.0129H19.1098ZM17.4528 30.5533C17.1171 29.9125 16.8371 29.2949 16.4817 28.7255C16.1316 28.1651 15.6523 28.1294 15.2789 28.6934C14.8947 29.2735 14.5967 29.9089 14.2251 30.5872C15.3579 31.0459 16.3578 31.2173 17.4528 30.5551V30.5533Z" fill="currentColor"/>
                <path d="M64.8578 27.0727C64.8667 30.9621 61.8526 33.9929 57.9679 33.9982C54.1334 34.0036 50.9416 30.8871 50.947 27.1441C50.9524 23.2673 54.0598 20.1686 57.9464 20.1597C61.8132 20.1526 64.8488 23.1887 64.8578 27.0727ZM54.6666 28.9701C54.9538 28.7291 55.25 28.4917 55.5337 28.2383C56.5533 27.3208 56.5443 27.2477 55.3649 26.6836C55.6898 25.2896 56.7113 24.4221 57.9805 24.4614C59.3412 24.5042 60.3088 25.3681 60.5188 26.7568C60.2011 26.7568 59.878 26.9942 59.5548 27.1138C59.4884 27.2066 59.4202 27.2994 59.3538 27.3922C59.9947 27.8688 60.6355 28.3454 61.2746 28.822C62.2727 27.6939 61.9963 25.5877 60.5978 24.274C58.9445 22.7211 56.6736 22.7764 55.0651 24.4078C53.8049 25.6858 53.5895 27.817 54.6684 28.9719L54.6684 28.9701ZM56.3038 30.598C57.4545 31.1602 58.449 31.1441 59.5369 30.5926C59.2138 29.9482 58.9588 29.3521 58.6267 28.8023C58.1905 28.0794 57.652 28.0955 57.2032 28.8416C56.8854 29.3699 56.6377 29.9393 56.3038 30.598Z" fill="currentColor"/>
                <path d="M9.29564 20.34C8.84147 21.7447 8.4573 22.9531 8.05159 24.1544C7.98876 24.3382 7.86131 24.5595 7.69974 24.6434C6.52391 25.2557 4.67669 24.2436 4.54743 22.9353C4.54384 22.9049 4.54384 22.8764 4.54025 22.846C4.36971 20.6131 4.66592 20.3043 6.90808 20.34C7.64589 20.3525 8.3837 20.3418 9.29564 20.3418V20.34Z" fill="currentColor"/>
              </svg>
            </div>
            <div v-else class="w-full flex justify-center">
              <svg width="80" height="34" viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.1869 28.9898C22.786 26.326 22.2922 23.9143 20.382 21.8928C18.9656 20.3924 17.1874 19.6099 15.1183 19.5588C12.5841 19.4943 10.5647 20.5098 9.00667 22.4915C7.46394 24.4542 7.20745 26.6652 7.75487 29.2853C5.46565 28.9898 3.35061 28.7984 1.27385 28.4138C0.117752 28.1997 -0.119592 27.3851 0.328299 26.3241C0.485253 25.9509 0.567558 25.4546 0.458456 25.0775C-0.11385 23.0788 -0.219123 21.1123 0.540761 19.1344C0.672831 18.7915 0.630722 18.386 0.691972 18.0128C1.07287 15.7223 2.49694 14.2579 4.6292 13.5474C7.0103 12.7536 9.47753 12.2174 11.8567 11.4217C13.3478 10.9235 14.8427 10.3059 16.1653 9.47605C20.2231 6.92411 24.1144 4.09935 28.5895 2.25218C31.4893 1.05673 34.5614 0.704348 37.6468 0.503527C48.7025 -0.212607 59.7658 -0.0913572 70.8253 0.4088C72.5747 0.488371 74.3203 0.647512 76.0621 0.831281C76.3856 0.865383 76.801 1.12493 76.9388 1.39775C77.0287 1.57583 76.7627 2.04568 76.533 2.24082C76.0009 2.69361 76.0239 3.14451 76.2382 3.74508C77.0019 5.88401 77.7465 8.03052 78.4337 10.196C79.3601 13.1154 78.9983 16.1391 79.1055 19.1268C79.1342 19.9434 79.4194 20.7599 79.6606 21.5556C80.1659 23.219 80.1257 24.8938 79.4137 26.434C79.1744 26.9493 78.2633 27.3093 77.5953 27.4533C75.4822 27.9118 73.3403 28.2338 71.0473 28.6393C71.5047 25.4091 70.6128 22.7889 67.9829 20.9096C66.4497 19.8145 64.7194 19.3712 62.8321 19.5853C59.0002 20.0191 55.3443 23.8347 56.4449 28.9879H22.1869V28.9898ZM77.4958 16.8628L77.7791 16.6412C77.7791 15.4874 77.9111 14.3128 77.7465 13.1818C77.5341 11.7249 77.1168 10.2926 76.7072 8.87358C76.6268 8.59509 76.1732 8.42079 75.8918 8.19913C75.7291 8.50036 75.4458 8.7978 75.4305 9.10661C75.3941 9.85874 75.4726 10.6185 75.5262 11.3744C75.576 12.081 75.3099 12.4334 74.5462 12.4183C73.6542 12.4012 72.7604 12.4637 71.8684 12.4694C67.9771 12.4959 64.0877 12.53 60.1964 12.5225C59.4404 12.5225 59.0671 12.6968 59.1437 13.519C59.205 14.1764 59.1227 14.8452 59.1609 15.5064C59.2222 16.5427 58.8719 17.3062 57.9512 17.8859C56.5272 18.7839 55.4036 20.0191 54.6782 21.5196C54.0293 22.8647 53.5642 24.297 52.9881 25.769C49.0011 25.769 44.8916 25.7615 40.7802 25.7766C40.0528 25.7804 40.1581 25.303 40.1562 24.8767C40.1466 21.7829 40.1428 18.6911 40.139 15.5973C40.1332 11.4937 40.1351 7.39016 40.1102 3.28849C40.1102 3.02894 39.9533 2.61404 39.7715 2.54962C39.5456 2.47005 39.1207 2.60267 38.9561 2.79023C38.8068 2.96074 38.8718 3.33207 38.8718 3.61435C38.8546 10.59 38.8431 17.5657 38.8259 24.5414C38.8259 24.9355 38.7838 25.3295 38.7589 25.7842C36.4084 25.7842 34.1786 25.7842 31.9468 25.7842C30.5763 25.7842 29.202 25.7558 27.8334 25.8069C26.9568 25.841 26.1414 26.0873 25.5653 27.0516C25.9902 27.0782 26.2065 27.1047 26.4228 27.1028C35.0973 27.0914 43.7719 27.0801 52.4464 27.063C54.3107 27.0592 54.3088 27.0498 54.6303 25.2784C54.6533 25.1552 54.6973 25.0359 54.7241 24.9127C55.285 22.3513 56.7186 20.362 58.8394 18.8502C59.9074 18.0886 60.495 17.1508 60.4089 15.8114C60.3687 15.1938 60.4606 14.5686 60.495 13.9093C60.8185 13.8846 61.0654 13.8505 61.3143 13.8486C65.0142 13.8107 68.7179 13.8846 72.4082 13.6971C74.2648 13.6023 75.509 14.1044 76.3512 15.7432C76.5828 16.1922 77.1072 16.4934 77.4958 16.8628ZM48.6393 2.18777C48.6393 2.26355 48.6393 2.33933 48.6393 2.41511C46.6008 2.41511 44.5624 2.42269 42.522 2.40943C41.9497 2.40564 41.5324 2.6292 41.5592 3.19945C41.5994 4.00273 41.6396 4.84959 41.9209 5.58846C42.3306 6.67403 42.9622 7.67624 43.4828 8.72202C44.2389 10.2395 45.4696 10.9708 47.1674 10.9292C50.0021 10.8591 52.8369 10.7643 55.6716 10.7094C56.3913 10.6942 56.5138 10.3437 56.4468 9.7356C56.2133 7.60425 55.9683 5.47289 55.8075 3.33775C55.7424 2.48711 55.3941 2.17072 54.5653 2.18019C52.5899 2.20292 50.6146 2.18777 48.6393 2.18777ZM58.5676 2.36396C59.0097 4.72645 59.4347 6.98094 59.8519 9.23733C60.1103 10.6336 60.1046 10.6298 61.5439 10.5919C64.5337 10.5124 67.5273 10.4858 70.5152 10.3456C72.0254 10.2755 72.7738 9.20134 72.3125 7.78801C71.8856 6.47889 71.3038 5.21334 70.7219 3.95726C70.3391 3.12935 69.6194 2.66709 68.6872 2.59509C67.5465 2.50795 66.4038 2.39048 65.2592 2.37343C63.0733 2.33744 60.8855 2.36396 58.5676 2.36396ZM25.3738 12.2572C29.1082 11.9617 32.7258 11.6927 36.3357 11.3497C36.5979 11.3251 36.9827 10.7757 37.0133 10.4442C37.2123 8.2768 37.3368 6.10377 37.4707 3.93074C37.5435 2.76181 37.3808 2.5913 36.1941 2.66898C32.2109 2.92853 28.5397 4.13535 25.0925 6.13409C23.9766 6.78202 23.5765 7.5493 23.8541 8.73907C25.8906 9.08388 26.2964 9.94778 25.3719 12.2572H25.3738ZM9.74742 14.3848C9.34546 14.3848 9.08132 14.3431 8.83632 14.3924C7.34335 14.6879 5.83507 14.9418 4.37081 15.3453C3.76788 15.512 3.10561 15.908 2.74959 16.3987C2.35721 16.9405 2.28447 17.7116 2.07201 18.3823C2.68643 18.3917 3.30467 18.4561 3.91143 18.4031C6.5337 18.1776 8.38077 16.8079 9.7455 14.3848H9.74742ZM22.1678 8.1745C22.0625 8.11956 21.9592 8.06272 21.8539 8.00778C20.114 9.27144 18.3684 10.5256 16.6476 11.812C16.4581 11.9541 16.4103 12.2819 16.2954 12.5225C16.5462 12.6172 16.8007 12.801 17.0477 12.7915C18.3511 12.7365 19.6565 12.6683 20.9504 12.5187C21.2356 12.4865 21.6663 12.1398 21.7122 11.884C21.9247 10.6582 22.0281 9.41353 22.1697 8.1764L22.1678 8.1745ZM2.25194 22.4934C2.97354 23.8783 3.74873 25.2897 2.09498 26.6367C3.76405 27.0251 3.94397 26.9474 4.12198 25.4849C4.21194 24.7479 4.17174 23.973 4.0435 23.2417C3.86358 22.213 3.35827 22.0254 2.25194 22.4953V22.4934ZM35.5203 15.0062C35.5203 15.0251 35.5203 15.0422 35.5203 15.0611C36.0275 15.0327 36.5501 15.0668 37.0324 14.9475C37.2583 14.8906 37.509 14.5553 37.555 14.3109C37.5798 14.1707 37.2238 13.8145 37.0267 13.8051C36.0467 13.7596 35.0609 13.7672 34.0828 13.8316C33.88 13.8448 33.5182 14.2143 33.5488 14.3526C33.6005 14.597 33.8666 14.9285 34.0982 14.9778C34.5518 15.0763 35.0437 15.0062 35.5184 15.0062H35.5203ZM43.3795 15.0213C43.8235 15.0213 44.2829 15.0896 44.704 14.9967C44.9796 14.9361 45.2036 14.6405 45.4505 14.4492C45.2265 14.237 45.016 13.8619 44.7748 13.8411C43.8618 13.7634 42.9373 13.7634 42.0224 13.8221C41.7965 13.8354 41.5936 14.1764 41.3793 14.3658C41.6032 14.5837 41.7946 14.9247 42.0568 14.991C42.4722 15.0971 42.9373 15.0195 43.3795 15.0195V15.0213Z" fill="#2b8fd4"/>
                <path d="M57.6699 26.9096C57.6699 23.5562 60.3381 20.9247 63.7451 20.9171C67.1636 20.9096 69.7572 23.5278 69.7974 27.027C69.8338 30.2402 67.0507 33.0043 63.7796 33.0005C60.3898 32.9986 57.6718 30.2875 57.6718 26.9077L57.6699 26.9096ZM67.0967 28.9102C68.3274 27.4268 67.9542 25.1552 66.3329 23.7949C64.6179 22.3551 62.1947 22.5464 60.6807 24.2383C59.3983 25.6724 59.2605 27.8151 60.43 28.8723C60.7266 28.5995 61.0272 28.3248 61.3277 28.0463C62.2904 27.1559 62.2445 26.919 61.0176 26.4302C61.4942 24.7574 62.4876 24.0014 64.0208 24.1435C65.3281 24.2648 66.2468 25.2026 66.3636 26.5307C65.15 26.974 65.1271 27.1142 66.1262 28.0444C66.442 28.338 66.7713 28.6203 67.0967 28.9102ZM65.4123 30.4504C65.0543 29.7741 64.7519 29.1167 64.3691 28.5085C64.0456 27.9951 63.5384 27.8189 63.1441 28.3949C62.7115 29.0295 62.4091 29.7495 62.055 30.4201C63.1709 31.106 64.2313 31.1173 65.4123 30.4486V30.4504Z" fill="#2b8fd4"/>
                <path d="M15.0111 20.9096C18.3875 20.9096 21.0442 23.6263 21.0327 27.0649C21.0232 30.3785 18.2248 33.0251 14.7623 32.9967C11.606 32.9702 8.93394 30.2572 8.9148 27.0573C8.89375 23.5297 11.493 20.9077 15.0111 20.9096ZM18.3377 28.9216C19.5226 27.2752 19.0727 24.9279 17.44 23.7021C15.5891 22.3134 13.321 22.5654 11.8127 24.3292C10.6107 25.7331 10.5188 27.8512 11.6481 28.8704C11.9275 28.6241 12.2127 28.3778 12.4941 28.1259C13.5526 27.1786 13.5239 26.9929 12.2491 26.4492C12.5611 24.9298 13.61 24.0886 15.1336 24.1341C16.4447 24.1739 17.4324 25.1287 17.5951 26.5117C16.3433 26.9058 16.3088 27.0801 17.3003 27.9932C17.6238 28.2907 17.9568 28.5805 18.3358 28.9216H18.3377ZM16.6897 30.4846C16.305 29.7798 16.0275 29.0978 15.5853 28.5464C15.3958 28.3096 14.6187 28.1638 14.5249 28.2869C14.0579 28.9007 13.7134 29.6093 13.3707 30.3065C13.3344 30.3823 13.5679 30.693 13.7248 30.7403C14.6857 31.0359 15.6427 31.0681 16.6897 30.4846Z" fill="#2b8fd4"/>
              </svg>
            </div>            <div class="font-bold text-sm sm:text-base text-brand-700">{{ localeStore.t(vehicle.name) }}</div>
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
              <div class="font-bold text-brand-700">{{ localeStore.t(service.title || service.name) }}</div>
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
            {{ localeStore.t(service.title || service.name) }} <span class="opacity-60 ml-1">+{{ localeStore.formatPrice(getMatrixDetails(service.id)?.price || 0) }}</span>
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
          
          <!-- License Plate Input (Georgian format or Transit) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                {{ localeStore.locale === 'ka' ? 'ავტომობილის სახელმწიფო ნომერი *' : 'Vehicle License Plate *' }}
              </label>
              
              <!-- Transit checkbox -->
              <label class="flex items-center gap-1.5 cursor-pointer select-none" :class="{ 'opacity-40 cursor-not-allowed': selectedCarId }">
                <input 
                  type="checkbox" 
                  v-model="isTransitPlate"
                  :disabled="!!selectedCarId"
                  @change="validateBookingPlate"
                  class="rounded text-brand-500 focus:ring-brand-400 border-brand-200"
                />
                <span class="text-[9px] font-bold text-brand-500 uppercase tracking-wider">
                  {{ localeStore.locale === 'ka' ? 'ტრანზიტული' : 'Transit' }}
                </span>
              </label>
            </div>
            
            <input 
              type="text" 
              v-model="store.licensePlate"
              :disabled="!!selectedCarId"
              @input="handlePlateInput"
              :placeholder="isTransitPlate ? (localeStore.locale === 'ka' ? 'მაგ: AA-0000 ან 00-0000' : 'e.g. AA-0000 or 00-0000') : (localeStore.locale === 'ka' ? 'მაგ: AA-123-AA' : 'e.g. AA-123-AA')"
              class="w-full glass-input rounded-lg px-4 py-2.5 outline-none focus:ring-cyan-focus text-sm font-bold tracking-widest uppercase text-brand-700 bg-white border border-brand-100"
              :class="{ 'opacity-65 cursor-not-allowed bg-slate-50': selectedCarId }"
            />
            <p v-if="bookingPlateError" class="text-[10px] text-rose-500 font-bold mt-1 anim-expand">{{ bookingPlateError }}</p>
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
          <p class="text-sm text-brand-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
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
            <span>{{ currentStep === 1 ? localeStore.t('nextVehicle') : currentStep === 2 ? (localeStore.locale === 'ka' ? 'შემდეგი: სერვისები' : 'Next: Services') : (localeStore.locale === 'ka' ? 'შემდეგი: გადახდა' : 'Next: Payment') }}</span>
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
            <div class="text-xs text-brand-500 font-mono mt-0.5">{{ customerAuth.customer?.phoneNumber }}</div>
          </div>
          <button @click="showCabinet = false" class="glass-card w-8 h-8 rounded-full flex items-center justify-center hover:text-brand-500 transition-colors">
            ✕
          </button>
        </div>

        <!-- Tabs Switcher -->
        <div class="flex border-b border-brand-100 bg-slate-50/50 shrink-0">
          <button 
            type="button"
            @click="activeCabinetTab = 'bookings'"
            class="flex-1 py-3.5 text-xs font-bold text-center border-b-2 transition-all duration-200"
            :class="[
              activeCabinetTab === 'bookings'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-brand-400 hover:text-brand-500'
            ]"
          >
            {{ localeStore.t('bookingHistory') }}
          </button>
          <button 
            type="button"
            @click="activeCabinetTab = 'cars'"
            class="flex-1 py-3.5 text-xs font-bold text-center border-b-2 transition-all duration-200"
            :class="[
              activeCabinetTab === 'cars'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-brand-400 hover:text-brand-500'
            ]"
          >
            {{ localeStore.t('myCars') }}
          </button>
        </div>

        <!-- Scrollable content area -->
        <div class="flex-grow overflow-y-auto p-5">
          <!-- Bookings Tab -->
          <div v-if="activeCabinetTab === 'bookings'" class="space-y-3">
            <div v-if="customerAuth.customerBookings.length === 0" class="text-center py-10 bg-brand-100/40 rounded-xl border border-brand-100">
              <svg class="w-8 h-8 mx-auto text-brand-400/80 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <p class="text-xs text-brand-500 font-bold mt-2">{{ localeStore.t('noActiveBookings') }}</p>
            </div>
            <div 
              v-else
              v-for="booking in customerAuth.customerBookings" 
              :key="booking.id"
              class="glass-card rounded-xl p-3 border border-brand-100 flex items-center justify-between gap-3 hover:border-brand-200 transition-all duration-150"
            >
              <!-- Left: Branch, Date/Time & Services -->
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <div class="font-extrabold text-brand-700 text-xs truncate">{{ localeStore.t(booking.branch?.name || 'საბურთალოს ფილიალი') }}</div>
                  <div class="text-[10px] text-brand-400 font-medium shrink-0">{{ formatDateHuman(booking.startTime) }}</div>
                </div>
                <!-- Service badges -->
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-[8px] font-black uppercase bg-brand-50 text-brand-500 px-1 py-0.5 rounded border border-brand-100/60 leading-none">{{ booking.vehicleType?.name ? localeStore.t(booking.vehicleType.name) : 'სედანი' }}</span>
                  <span 
                    v-for="s in booking.bookingServices" 
                    :key="s.serviceId"
                    class="text-[8px] font-semibold bg-brand-50/70 text-brand-600 px-1.5 py-0.5 rounded border border-brand-100/60 leading-none"
                  >
                    {{ (s.service?.title || s.service?.name) ? localeStore.t(s.service.title || s.service.name) : 'რეცხვა' }}
                  </span>
                </div>
              </div>

              <!-- Right: Status Badge & Price -->
              <div class="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  :class="[
                    booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    booking.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  ]"
                >
                  {{ getStatusLabel(booking.status) }}
                </span>
                <div class="font-mono font-black text-brand-600 text-xs leading-none">{{ localeStore.formatPrice(booking.totalPrice) }}</div>
              </div>
            </div>
          </div>

          <!-- Cars Tab -->
          <div v-else-if="activeCabinetTab === 'cars'" class="space-y-4">
            <!-- Add Car Button (if form is hidden) -->
            <button 
              v-if="!showAddCarForm"
              type="button"
              @click="showAddCarForm = true"
              class="w-full py-2.5 px-4 rounded-xl border border-dashed border-brand-300 hover:border-brand-500 text-brand-500 hover:text-brand-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-brand-50/25 hover:bg-brand-50/50"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {{ localeStore.t('addCarBtn') }}
            </button>

            <!-- Add Car Form -->
            <div v-else class="glass-card rounded-xl p-4 border border-brand-200 space-y-3.5 bg-slate-50/30">
              <div class="font-bold text-xs text-brand-600 tracking-wide uppercase">{{ localeStore.t('addCarTitle') }}</div>
              
              <!-- Brand/Make Select -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('carBrand') }}</label>
                <select 
                  v-model="carForm.make"
                  @change="handleMakeChange"
                  class="w-full glass-input rounded-lg px-3 py-2.5 outline-none focus:ring-cyan-focus text-xs font-semibold text-brand-700 bg-white border border-brand-100"
                >
                  <option value="" disabled v-if="isLoadingMakes">{{ localeStore.locale === 'ka' ? 'იტვირთება...' : 'Loading...' }}</option>
                  <option value="" disabled v-else>{{ localeStore.t('selectBrand') }}</option>
                  <option v-for="brand in carMakes" :key="brand" :value="brand">{{ brand }}</option>
                </select>
                <p v-if="carFormErrors.make" class="text-[10px] text-rose-500 font-bold mt-1">{{ carFormErrors.make }}</p>
              </div>

              <!-- Custom Make Input (if Other) -->
              <div v-if="carForm.make === 'Other'" class="space-y-1 anim-expand">
                <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('carBrand') }} (Custom)</label>
                <input 
                  type="text"
                  v-model="customMake"
                  :placeholder="localeStore.t('carBrand')"
                  class="w-full glass-input rounded-lg px-3 py-2.5 outline-none focus:ring-cyan-focus text-xs font-semibold text-brand-700 bg-white border border-brand-100"
                />
              </div>

              <!-- Model/Series Select (if not Other) -->
              <div v-if="carForm.make && carForm.make !== 'Other'" class="space-y-1 anim-expand">
                <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('carSeries') }}</label>
                <select 
                  v-model="carForm.model"
                  class="w-full glass-input rounded-lg px-3 py-2.5 outline-none focus:ring-cyan-focus text-xs font-semibold text-brand-700 bg-white border border-brand-100"
                >
                  <option value="" disabled v-if="isLoadingModels">{{ localeStore.locale === 'ka' ? 'იტვირთება...' : 'Loading...' }}</option>
                  <option value="" disabled v-else>{{ localeStore.t('selectModel') }}</option>
                  <option v-for="model in carModels" :key="model" :value="model">{{ model }}</option>
                </select>
                <p v-if="carFormErrors.model" class="text-[10px] text-rose-500 font-bold mt-1">{{ carFormErrors.model }}</p>
              </div>

              <!-- Custom Model Input (if Other) -->
              <div v-if="carForm.make === 'Other'" class="space-y-1 anim-expand">
                <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('carSeries') }} (Custom)</label>
                <input 
                  type="text"
                  v-model="customModel"
                  :placeholder="localeStore.t('carSeries')"
                  class="w-full glass-input rounded-lg px-3 py-2.5 outline-none focus:ring-cyan-focus text-xs font-semibold text-brand-700 bg-white border border-brand-100"
                />
              </div>

              <!-- License Plate Input -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{{ localeStore.t('licensePlate') }}</label>
                <input 
                  type="text"
                  v-model="carForm.licensePlate"
                  :placeholder="localeStore.t('platePlaceholder')"
                  class="w-full glass-input rounded-lg px-3 py-2.5 outline-none focus:ring-cyan-focus text-xs font-bold text-brand-700 bg-white tracking-widest uppercase border border-brand-100"
                />
                <p v-if="carFormErrors.licensePlate" class="text-[10px] text-rose-500 font-bold mt-1">{{ carFormErrors.licensePlate }}</p>
              </div>

              <!-- Form Buttons -->
              <div class="flex gap-2 pt-2">
                <button 
                  type="button"
                  @click="showAddCarForm = false"
                  class="flex-1 py-2 rounded-lg border border-brand-200 text-brand-500 hover:bg-brand-50 text-xs font-bold transition-all"
                >
                  {{ localeStore.t('cancel') }}
                </button>
                <button 
                  type="button"
                  @click="handleAddCar"
                  :disabled="isSavingCar"
                  class="flex-1 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center"
                >
                  <span v-if="isSavingCar" class="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5"></span>
                  {{ localeStore.t('saveCar') }}
                </button>
              </div>
            </div>

            <!-- Saved Cars List -->
            <div v-if="customerAuth.savedCars.length === 0" class="text-center py-10 bg-brand-100/40 rounded-xl border border-brand-100">
              <svg class="w-8 h-8 mx-auto text-brand-400/80 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
              <p class="text-xs text-brand-500 font-bold mt-2">{{ localeStore.t('noCarsFound') }}</p>
            </div>
            
            <div 
              v-else
              v-for="car in customerAuth.savedCars"
              :key="car.id"
              class="glass-card rounded-xl p-4 border border-brand-200 flex items-center justify-between gap-3 hover:border-brand-300 transition-all shadow-sm"
            >
              <div class="min-w-0 flex items-start gap-2.5">
                <svg class="w-4 h-4 text-brand-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                  <circle cx="7" cy="17" r="2"/>
                  <path d="M9 17h6"/>
                  <circle cx="17" cy="17" r="2"/>
                </svg>
                <div class="min-w-0">
                  <div class="font-bold text-brand-700 text-sm leading-tight">{{ car.make }} {{ car.model }}</div>
                  <div class="text-[10px] font-black text-brand-500 font-mono mt-1 tracking-wider uppercase bg-brand-50 px-2 py-0.5 rounded border border-brand-100 inline-block">
                    {{ car.licensePlate }}
                  </div>
                </div>
              </div>
              <button 
                type="button"
                @click="handleDeleteCar(car.id)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all shrink-0"
                title="Delete Car"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-brand-200/50 shrink-0">
          <button 
            type="button" 
            @click="handleLogout" 
            class="w-full glass-card rounded-xl py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all border border-rose-300"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              <span>{{ localeStore.t('logOut') }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </template>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useSettingsStore } from '~/stores/settingsStore'
import { useNotificationStore } from '~/stores/notificationStore'

const store = useBookingStore()
const localeStore = useLocaleStore()
const customerAuth = useCustomerAuthStore()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

const currentStep = ref(1)
const submittingBooking = ref(false)
const confirmedBookingId = ref('')
const confirmedBranchName = ref('')
const confirmedBooking = ref(null)
const showCabinet = ref(false)
const showPwd = ref(false)

// Customer cars management setup
const activeCabinetTab = ref('bookings')
const showAddCarForm = ref(false)
const carForm = ref({
  make: '',
  model: '',
  licensePlate: ''
})
const carFormErrors = ref({
  make: '',
  model: '',
  licensePlate: ''
})
const customMake = ref('')
const customModel = ref('')
const isSavingCar = ref(false)
const selectedCarId = ref('')
const isTransitPlate = ref(false)
const bookingPlateError = ref('')

const carMakes = ref([])
const carModels = ref([])
const isLoadingMakes = ref(false)
const isLoadingModels = ref(false)

const CAR_BRANDS = {
  "Toyota": ["Prius", "Camry", "RAV4", "Corolla", "Land Cruiser", "Aqua", "Vitz", "Yaris", "Prius C"],
  "Mercedes-Benz": ["E-Class", "C-Class", "S-Class", "ML-Class", "G-Class", "GLC-Class", "A-Class", "CLA-Class", "Sprinter"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X5", "X6", "1 Series", "4 Series", "X3", "X1"],
  "Lexus": ["RX", "GX", "IS", "ES", "NX", "LX", "CT200h"],
  "Ford": ["Fusion", "Mustang", "Focus", "Escape", "Explorer", "F-150", "Fiesta"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Accent", "Ioniq"],
  "Honda": ["Civic", "CR-V", "Fit", "Insight", "Accord", "HR-V"],
  "Nissan": ["Tiida", "Juke", "Leaf", "X-Trail", "Rogue", "Sentra"],
  "Audi": ["A4", "A6", "A8", "Q5", "Q7", "e-tron", "A3"],
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Jetta", "ID.4", "Polo"],
  "Opel": ["Astra", "Corsa", "Vectra", "Zafira", "Insignia"],
  "Other": []
}

async function fetchCarMakes() {
  const config = useRuntimeConfig()
  const apiKey = config.public.ninjaApiKey

  if (!apiKey) {
    carMakes.value = Object.keys(CAR_BRANDS)
    return
  }

  isLoadingMakes.value = true
  try {
    const data = await $fetch('https://api.api-ninjas.com/v1/carmakes', {
      headers: { 'X-Api-Key': apiKey }
    })
    if (Array.isArray(data)) {
      const formatted = data.map(m => m.charAt(0).toUpperCase() + m.slice(1))
      formatted.sort()
      if (!formatted.includes('Other')) {
        formatted.push('Other')
      }
      carMakes.value = formatted
    } else {
      carMakes.value = Object.keys(CAR_BRANDS)
    }
  } catch (err) {
    console.error('Failed to fetch car makes from API-Ninjas, falling back:', err)
    carMakes.value = Object.keys(CAR_BRANDS)
  } finally {
    isLoadingMakes.value = false
  }
}

async function fetchCarModels(make) {
  carModels.value = []
  if (!make) return

  if (make === 'Other') {
    return
  }

  const config = useRuntimeConfig()
  const apiKey = config.public.ninjaApiKey

  if (!apiKey) {
    carModels.value = CAR_BRANDS[make] || []
    return
  }

  isLoadingModels.value = true
  try {
    const data = await $fetch(`https://api.api-ninjas.com/v1/cars?make=${make.toLowerCase()}&limit=50`, {
      headers: { 'X-Api-Key': apiKey }
    })
    if (Array.isArray(data)) {
      const modelsSet = new Set(data.map(item => {
        const m = item.model || ''
        return m.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }))
      const formatted = Array.from(modelsSet).filter(Boolean)
      formatted.sort()
      carModels.value = formatted
    } else {
      carModels.value = CAR_BRANDS[make] || []
    }
  } catch (err) {
    console.error(`Failed to fetch models for ${make} from API-Ninjas, falling back:`, err)
    carModels.value = CAR_BRANDS[make] || []
  } finally {
    isLoadingModels.value = false
  }
}

async function handleMakeChange() {
  carForm.value.model = ''
  customMake.value = ''
  customModel.value = ''
  await fetchCarModels(carForm.value.make)
}

watch(showCabinet, (val) => {
  if (!val) {
    activeCabinetTab.value = 'bookings'
    showAddCarForm.value = false
    carForm.value = { make: '', model: '', licensePlate: '' }
    customMake.value = ''
    customModel.value = ''
    carModels.value = []
  }
})

async function handleAddCar() {
  carFormErrors.value = { make: '', model: '', licensePlate: '' }
  let hasError = false

  if (!carForm.value.make) {
    carFormErrors.value.make = localeStore.locale === 'ka' ? 'მწარმოებელი სავალდებულოა' : 'Brand is required'
    hasError = true
  }
  
  if (carForm.value.make && carForm.value.make !== 'Other' && !carForm.value.model) {
    carFormErrors.value.model = localeStore.locale === 'ka' ? 'სერია/მოდელი სავალდებულოა' : 'Series/Model is required'
    hasError = true
  }

  if (carForm.value.make === 'Other') {
    if (!customMake.value.trim()) {
      carFormErrors.value.make = localeStore.locale === 'ka' ? 'მწარმოებელი სავალდებულოა' : 'Brand is required'
      hasError = true
    }
    if (!customModel.value.trim()) {
      carFormErrors.value.model = localeStore.locale === 'ka' ? 'სერია/მოდელი სავალდებულოა' : 'Series/Model is required'
      hasError = true
    }
  }

  const plateRegex = /^[A-Z0-9-]{3,10}$/i
  if (!carForm.value.licensePlate) {
    carFormErrors.value.licensePlate = localeStore.locale === 'ka' ? 'ავტომობილის ნომერი სავალდებულოა' : 'Plate number is required'
    hasError = true
  } else if (!plateRegex.test(carForm.value.licensePlate.replace(/\s+/g, ''))) {
    carFormErrors.value.licensePlate = localeStore.locale === 'ka' ? 'არასწორი ნომრის ფორმატი' : 'Invalid plate format'
    hasError = true
  }

  if (hasError) return

  isSavingCar.value = true
  const finalMake = carForm.value.make === 'Other' ? customMake.value : carForm.value.make
  const finalModel = carForm.value.make === 'Other' ? customModel.value : carForm.value.model

  const result = await customerAuth.addCar(finalMake, finalModel, carForm.value.licensePlate.replace(/\s+/g, '').toUpperCase())
  isSavingCar.value = false

  if (result.success) {
    notificationStore.addToast('success', localeStore.locale === 'ka' ? 'წარმატება' : 'Success', localeStore.t('carAddedSuccess'))
    carForm.value = { make: '', model: '', licensePlate: '' }
    customMake.value = ''
    customModel.value = ''
    showAddCarForm.value = false
  } else {
    notificationStore.addToast('danger', localeStore.locale === 'ka' ? 'შეცდომა' : 'Error', result.error || 'Failed to add car')
  }
}

async function handleDeleteCar(carId) {
  if (confirm(localeStore.locale === 'ka' ? 'ნამდვილად გსურთ ავტომობილის წაშლა?' : 'Are you sure you want to delete this car?')) {
    const result = await customerAuth.deleteCar(carId)
    if (result.success) {
      notificationStore.addToast('success', localeStore.locale === 'ka' ? 'წარმატება' : 'Success', localeStore.t('carDeletedSuccess'))
    } else {
      notificationStore.addToast('danger', localeStore.locale === 'ka' ? 'შეცდომა' : 'Error', result.error || 'Failed to delete car')
    }
  }
}

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

async function selectFirstAvailableDate() {
  // If a date is already selected, check if it still has slots available
  if (store.selectedDate) {
    await store.fetchAvailableSlots()
    if (store.availableSlots && store.availableSlots.length > 0) {
      return
    }
  }

  const today = new Date()
  const limitDays = settingsStore.bookingWindowDays || 30
  
  for (let i = 0; i < limitDays; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)
    
    // Check if outside booking window
    if (isDateOutsideBookingWindow(d)) continue
    
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    const dateStr = `${yStr}-${mStr}-${dStr}`
    
    // Check if non-working day
    if (settingsStore.calendarOverrides[dateStr] === "non_working") {
      continue
    }
    
    // Set date temporarily to fetch slots
    store.selectedDate = dateStr
    await store.fetchAvailableSlots()
    
    if (store.availableSlots && store.availableSlots.length > 0) {
      // Found a day with available slots!
      store.selectedStartTime = ""
      
      // Update calendar navigation view so it matches this date's month and year
      calendarYear.value = d.getFullYear()
      calendarMonth.value = d.getMonth()
      return
    }
  }
  
  // Default fallback if no day has slots
  const yStr = today.getFullYear()
  const mStr = String(today.getMonth() + 1).padStart(2, '0')
  const dStr = String(today.getDate()).padStart(2, '0')
  store.selectedDate = `${yStr}-${mStr}-${dStr}`
  store.selectedStartTime = ""
  await store.fetchAvailableSlots()
}

watch(currentStep, async (newStep) => {
  if (newStep === 4) {
    await selectFirstAvailableDate()
  }
})

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
      isPast: isDateInPast(prevMonthDate) || isDateOutsideBookingWindow(prevMonthDate)
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d)
    days.push({
      date: currentDate,
      dayNum: d,
      isCurrentMonth: true,
      isPast: isDateInPast(currentDate) || isDateOutsideBookingWindow(currentDate)
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
      isPast: isDateInPast(nextMonthDate) || isDateOutsideBookingWindow(nextMonthDate)
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

function isDateOutsideBookingWindow(date) {
  const limitDays = settingsStore.bookingWindowDays || 0
  if (limitDays <= 0) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const diffTime = compareDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  return diffDays > limitDays
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
  await fetchCarMakes()
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
  selectedCarId.value = ''
  store.licensePlate = ''
}

function determineVehicleTypeId(make, model) {
  const suvModels = [
    "RAV4", "Land Cruiser", "ML-Class", "G-Class", "GLC-Class", 
    "X5", "X6", "X3", "X1", "RX", "GX", "LX", "NX", 
    "Escape", "Explorer", "Tucson", "Santa Fe", "CR-V", "HR-V", 
    "Juke", "X-Trail", "Rogue", "Q5", "Q7", "e-tron", "Tiguan", "ID.4"
  ]
  const minivanModels = [
    "Sprinter", "Zafira", "Vito", "Viano", "Sienna", "Odyssey"
  ]

  const cleanModel = (model || '').trim()
  let typeKey = 'v-sedan'
  
  if (minivanModels.some(m => cleanModel.toLowerCase().includes(m.toLowerCase()))) {
    typeKey = 'v-minivan'
  } else if (suvModels.some(m => cleanModel.toLowerCase().includes(m.toLowerCase()))) {
    typeKey = 'v-suv'
  }

  // Find the matching vehicle type from bookingStore using name
  const match = store.vehicleTypes.find(v => {
    const name = (v.name || '').toLowerCase()
    if (typeKey === 'v-minivan' && (name.includes('minivan') || name.includes('მინივენი'))) return true
    if (typeKey === 'v-suv' && (name.includes('suv') || name.includes('jeep') || name.includes('ჯიპი'))) return true
    if (typeKey === 'v-sedan' && (name.includes('sedan') || name.includes('სედანი'))) return true
    return false
  })

  return match ? match.id : (store.vehicleTypes[0]?.id || '')
}

function getAutoDeterminedCategoryLabel(car) {
  const typeId = determineVehicleTypeId(car.make, car.model)
  const match = store.vehicleTypes.find(v => v.id === typeId)
  if (match) {
    const name = (match.name || '').toLowerCase()
    if (name.includes('minivan') || name.includes('მინივენი')) {
      return localeStore.locale === 'ka' ? 'მინივენი' : 'Minivan'
    }
    if (name.includes('suv') || name.includes('jeep') || name.includes('ჯიპი')) {
      return localeStore.locale === 'ka' ? 'ჯიპი / SUV' : 'SUV/Jeep'
    }
  }
  return localeStore.locale === 'ka' ? 'სედანი' : 'Sedan'
}

function selectSavedCarForBooking(car) {
  selectedCarId.value = car.id
  
  const typeId = determineVehicleTypeId(car.make, car.model)
  store.selectedVehicleTypeId = typeId
  // Clear services when switching vehicle type
  store.selectedServiceIds = []
  
  store.licensePlate = car.licensePlate
  isTransitPlate.value = false
  bookingPlateError.value = ''
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
    
    let isPlateValid = false
    if (store.licensePlate) {
      const cleanPlate = store.licensePlate.replace(/[\s-]/g, '')
      if (isTransitPlate.value) {
        isPlateValid = /^[A-Z0-9]{4,10}$/i.test(cleanPlate)
      } else {
        const modernRegex = /^[A-Z]{2}\d{3}[A-Z]{2}$/i
        isPlateValid = modernRegex.test(cleanPlate)
      }
    }

    return customerAuth.isAuthenticated && hasDateTime && isPaymentValid && isPlateValid
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

function handlePlateInput(e) {
  store.licensePlate = e.target.value.toUpperCase()
  validateBookingPlate()
}

function validateBookingPlate() {
  bookingPlateError.value = ''
  if (!store.licensePlate) {
    bookingPlateError.value = localeStore.locale === 'ka' ? 'ავტომობილის ნომერი სავალდებულოა' : 'Plate number is required'
    return false
  }

  const cleanPlate = store.licensePlate.replace(/[\s-]/g, '')
  if (isTransitPlate.value) {
    const transitRegex = /^[A-Z0-9]{4,10}$/i
    if (!transitRegex.test(cleanPlate)) {
      bookingPlateError.value = localeStore.locale === 'ka' ? 'არასწორი ტრანზიტული ნომრის ფორმატი' : 'Invalid transit plate format'
      return false
    }
  } else {
    const modernRegex = /^[A-Z]{2}\d{3}[A-Z]{2}$/i
    if (!modernRegex.test(cleanPlate)) {
      bookingPlateError.value = localeStore.locale === 'ka' ? 'არასწორი ნომრის ფორმატი (მაგ: AA-123-AA)' : 'Invalid format (e.g. AA-123-AA)'
      return false
    }
  }

  return true
}

async function sendSignupOtp() {
  store.error = null
  signupForm.value.sendingOtp = true
  const result = await customerAuth.sendOtp(signupForm.value.phoneNumber)
  signupForm.value.sendingOtp = false
  if (result && result.success) {
    signupForm.value.otpSent = true
  } else {
    store.error = customerAuth.error || 'კოდის გაგზავნა ვერ მოხერხდა.'
  }
}

async function submitRegister() {
  store.error = null
  
  checkNotificationPermission()
  
  // 1. Verify OTP code
  const verifyResult = await customerAuth.verifyOtp(
    signupForm.value.phoneNumber,
    signupForm.value.otpCode
  )
  if (!verifyResult || !verifyResult.success) {
    store.error = customerAuth.error || 'არასწორი ან ვადაგასული SMS კოდი.'
    return
  }

  // 2. Proceed with registration
  const payload = {
    name: signupForm.value.name,
    passwordHash: signupForm.value.password,
    phoneNumber: signupForm.value.phoneNumber,
    otpCode: signupForm.value.otpCode
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

  checkNotificationPermission()

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

function checkNotificationPermission() {
  const notificationStore = useNotificationStore()
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      notificationStore.requestDesktopPermission().catch(e => console.warn(e))
    } else if (Notification.permission === "denied") {
      const title = localeStore.locale === 'ka' ? 'ნოტიფიკაციები დაბლოკილია' : 'Notifications Blocked'
      const body = localeStore.locale === 'ka'
        ? 'გთხოვთ დააწკაპუნოთ ბრაუზერის მისამართების ზოლში ბოქლომის ხატულას და ჩართოთ ნოტიფიკაციები (Notifications).'
        : 'Please click the lock icon in your browser address bar and enable Notifications.'
      notificationStore.addToast('warning', title, body)
    }
  }
}

async function submitBookingOrder() {
  checkNotificationPermission()

  if (!validateBookingPlate()) {
    return
  }

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
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${min}`
}

function formatDateHuman(isoString) {
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

function formatDateSuccess(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const monthsKa = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"]
  const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const months = localeStore.locale === 'ka' ? monthsKa : monthsEn
  const monthStr = months[date.getUTCMonth()]
  const dayStr = date.getUTCDate()
  const yearStr = date.getUTCFullYear()
  return `${monthStr} ${dayStr}, ${yearStr} · ${hour}:${min}`
}

function getBayName(washingBayId) {
  const bay = store.washingBays.find(b => b.id === washingBayId)
  return bay ? localeStore.t(bay.name) : '1'
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
