<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div>
          <h3 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('dynamic_price_matrix') }}</h3>
          <p class="text-xs text-brand-500 mt-1 font-medium">Manage pricing and calendar block durations for all car types</p>
        </div>

        <button 
          @click="openAddModal"
          class="bg-brand-500 text-white flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
        >
          <span>➕</span>
          <span>{{ localeStore.t('add_service') }}</span>
        </button>
      </div>

      <!-- General matrix error alert -->
      <div v-if="matrixError" class="p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs flex justify-between items-center">
        <span>⚠️ {{ matrixError }}</span>
        <button @click="matrixError = ''" class="text-rose-400 font-bold text-sm">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="bookingStore.loadingGrid" class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden min-h-[300px]">
        <div class="overflow-x-auto">
          <div class="border-b border-brand-100 pb-3 flex justify-between animate-pulse">
            <div class="w-2/5 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-20 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-20 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-20 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-24 h-3 bg-slate-200/80 rounded"></div>
          </div>
          <div class="divide-y divide-brand-100">
            <div v-for="n in 4" :key="n" class="py-4 flex justify-between items-center animate-pulse">
              <div class="w-2/5 h-4 bg-slate-200/60 rounded"></div>
              <div class="w-16 h-3 bg-slate-200/50 rounded"></div>
              <div class="w-16 h-3 bg-slate-200/50 rounded"></div>
              <div class="w-16 h-3 bg-slate-200/50 rounded"></div>
              <div class="w-24 h-6.5 bg-slate-200/40 rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Spinner Loader overlay -->
        <div class="absolute inset-0 bg-[#F8FAFC]/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10 pointer-events-none rounded-2xl">
          <div class="inline-block animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full shadow-sm"></div>
          <span class="text-[9px] text-[#0C447C] font-black uppercase tracking-widest animate-pulse">
            {{ localeStore.t('loading_data') }}
          </span>
        </div>
      </div>

      <!-- Grid Matrix Layout -->
      <div v-else class="space-y-8">
        <!-- Main Services -->
        <div class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-[#0C447C] text-sm flex items-center gap-2">
                <span>📦</span>
                <span>{{ localeStore.t('main_services') }}</span>
              </h4>
              <p class="text-[10px] text-brand-500 font-medium mt-0.5">{{ localeStore.t('main_services_desc') }}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr class="border-b border-brand-100 text-brand-500 font-bold uppercase tracking-wider">
                  <th class="pb-4 font-semibold w-16 text-center">{{ localeStore.t('order') }}</th>
                  <th class="pb-4 font-semibold w-2/5">{{ localeStore.t('service_name') }}</th>
                  <th 
                    v-for="vt in bookingStore.vehicleTypes" 
                    :key="vt.id"
                    class="pb-4 font-black text-center"
                  >
                    🚗 {{ localeStore.t(vt.name) }}
                  </th>
                  <th class="pb-4 font-semibold text-right">{{ localeStore.t('actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-100">
                <tr 
                  v-for="service in mainServices" 
                  :key="service.id"
                  class="hover:bg-brand-100/30 transition duration-150"
                >
                  <!-- Reordering controls -->
                  <td class="py-4 align-middle text-center">
                    <div class="flex items-center justify-center gap-0.5">
                      <button 
                        @click="moveService(service, 'up')" 
                        :disabled="isFirst(service, mainServices)"
                        class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                        title="Move Up"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button 
                        @click="moveService(service, 'down')" 
                        :disabled="isLast(service, mainServices)"
                        class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                        title="Move Down"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  <!-- Service Info -->
                  <td class="py-4 align-middle">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-[#0C447C] text-sm">{{ localeStore.t(service.title || service.name) }}</span>
                      </div>
                      <span class="text-brand-500 font-light text-[11px] leading-relaxed max-w-sm">
                        {{ service.description ? (localeStore.t(service.description) || 'No description provided.') : 'No description provided.' }}
                      </span>
                    </div>
                  </td>

                  <!-- Price/Duration cells per Vehicle Type -->
                  <td 
                    v-for="vt in bookingStore.vehicleTypes" 
                    :key="vt.id"
                    class="py-4 text-center align-middle"
                  >
                    <div v-if="getCell(vt.id, service.id)" class="inline-flex flex-col items-center gap-1 bg-brand-100/40 border border-brand-200/50 p-3 rounded-xl min-w-[100px]">
                      <span class="text-[#2B8FD4] font-black text-sm">
                        {{ localeStore.formatPrice(getCell(vt.id, service.id).price) }}
                      </span>
                      <span class="text-brand-500 font-semibold text-[10px]">
                        ⏱️ {{ getCell(vt.id, service.id).durationMinutes }} {{ localeStore.t('mins') }}
                      </span>
                    </div>
                    <span v-else class="text-brand-400/80 font-bold">N/A</span>
                  </td>

                  <!-- Row Quick Actions -->
                  <td class="py-4 text-right align-middle">
                    <div class="flex justify-end gap-2">
                      <button 
                        @click="openEditModal(service)"
                        class="px-2.5 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500 bg-brand-100/40 hover:bg-brand-500 text-brand-600 hover:text-white font-bold transition duration-200 text-[10px]"
                      >
                        {{ localeStore.t('edit') }}
                      </button>
                      <button 
                        @click="confirmDelete(service)"
                        class="px-2.5 py-1.5 rounded-lg border border-rose-250 hover:border-rose-500 bg-rose-50/70 hover:bg-rose-500 text-rose-600 hover:text-white font-bold transition duration-200 text-[10px]"
                      >
                        {{ localeStore.t('delete') }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="mainServices.length === 0">
                  <td :colspan="3 + bookingStore.vehicleTypes.length" class="text-center py-8 text-brand-400 font-medium">
                    {{ localeStore.t('no_main_services') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Additional Services -->
        <div class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-[#0C447C] text-sm flex items-center gap-2">
                <span>✨</span>
                <span>{{ localeStore.t('addon_services') }}</span>
              </h4>
              <p class="text-[10px] text-brand-500 font-medium mt-0.5">{{ localeStore.t('addon_services_desc') }}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr class="border-b border-brand-100 text-brand-500 font-bold uppercase tracking-wider">
                  <th class="pb-4 font-semibold w-16 text-center">{{ localeStore.t('order') }}</th>
                  <th class="pb-4 font-semibold w-2/5">{{ localeStore.t('service_name') }}</th>
                  <th 
                    v-for="vt in bookingStore.vehicleTypes" 
                    :key="vt.id"
                    class="pb-4 font-black text-center"
                  >
                    🚗 {{ localeStore.t(vt.name) }}
                  </th>
                  <th class="pb-4 font-semibold text-right">{{ localeStore.t('actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-100">
                <tr 
                  v-for="service in addonServices" 
                  :key="service.id"
                  class="hover:bg-brand-100/30 transition duration-150"
                >
                  <!-- Reordering controls -->
                  <td class="py-4 align-middle text-center">
                    <div class="flex items-center justify-center gap-0.5">
                      <button 
                        @click="moveService(service, 'up')" 
                        :disabled="isFirst(service, addonServices)"
                        class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                        title="Move Up"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button 
                        @click="moveService(service, 'down')" 
                        :disabled="isLast(service, addonServices)"
                        class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                        title="Move Down"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  <!-- Service Info -->
                  <td class="py-4 align-middle">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-[#0C447C] text-sm">{{ localeStore.t(service.title || service.name) }}</span>
                        <span class="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 border border-brand-500/20 leading-none">
                          {{ localeStore.t('addon') }}
                        </span>
                      </div>
                      <span class="text-brand-500 font-light text-[11px] leading-relaxed max-w-sm">
                        {{ service.description ? (localeStore.t(service.description) || 'No description provided.') : 'No description provided.' }}
                      </span>
                    </div>
                  </td>

                  <!-- Price/Duration cells per Vehicle Type -->
                  <td 
                    v-for="vt in bookingStore.vehicleTypes" 
                    :key="vt.id"
                    class="py-4 text-center align-middle"
                  >
                    <div v-if="getCell(vt.id, service.id)" class="inline-flex flex-col items-center gap-1 bg-brand-100/40 border border-brand-200/50 p-3 rounded-xl min-w-[100px]">
                      <span class="text-[#2B8FD4] font-black text-sm">
                        {{ localeStore.formatPrice(getCell(vt.id, service.id).price) }}
                      </span>
                      <span class="text-brand-500 font-semibold text-[10px]">
                        ⏱️ {{ getCell(vt.id, service.id).durationMinutes }} {{ localeStore.t('mins') }}
                      </span>
                    </div>
                    <span v-else class="text-brand-400/80 font-bold">N/A</span>
                  </td>

                  <!-- Row Quick Actions -->
                  <td class="py-4 text-right align-middle">
                    <div class="flex justify-end gap-2">
                      <button 
                        @click="openEditModal(service)"
                        class="px-2.5 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500 bg-brand-100/40 hover:bg-brand-500 text-brand-600 hover:text-white font-bold transition duration-200 text-[10px]"
                      >
                        {{ localeStore.t('edit') }}
                      </button>
                      <button 
                        @click="confirmDelete(service)"
                        class="px-2.5 py-1.5 rounded-lg border border-rose-250 hover:border-rose-500 bg-rose-50/70 hover:bg-rose-500 text-rose-600 hover:text-white font-bold transition duration-200 text-[10px]"
                      >
                        {{ localeStore.t('delete') }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="addonServices.length === 0">
                  <td :colspan="3 + bookingStore.vehicleTypes.length" class="text-center py-8 text-brand-400 font-medium">
                    {{ localeStore.t('no_addon_services') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Service Dialog Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm">
      <div class="glass-panel max-w-xl w-full rounded-2xl p-6 shadow-glass relative space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-brand-100 pb-3">
          <div>
            <h4 class="font-bold text-[#0C447C] text-lg">
              {{ modalMode === 'add' ? localeStore.t('add_service') : localeStore.t('edit_service') }}
            </h4>
            <p class="text-[10px] text-brand-500 font-semibold tracking-wider uppercase mt-0.5">{{ localeStore.t('customize_service_desc') }}</p>
          </div>
          <button @click="showModal = false" class="text-brand-500 hover:text-brand-700 text-lg">✕</button>
        </div>

        <div v-if="modalError" class="p-3 rounded-lg bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs">
          ⚠️ {{ modalError }}
        </div>

        <!-- Form fields -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Service Name -->
            <div class="space-y-1.5 col-span-2">
              <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('service_name') }}</label>
              
              <input 
                v-if="localeStore.locale === 'ka'"
                type="text" 
                placeholder="სტანდარტული რეცხვა"
                v-model="form.nameKa"
                class="glass-input w-full p-2.5 rounded-lg text-xs"
              />
              <input 
                v-else
                type="text" 
                placeholder="Standard Wash"
                v-model="form.nameEn"
                class="glass-input w-full p-2.5 rounded-lg text-xs"
              />
            </div>

            <!-- Type -->
            <div class="space-y-1.5 col-span-2">
              <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('is_addon_label') }}</label>
              <div class="relative">
                <select 
                  v-model="form.isAddon"
                  class="glass-input w-full p-2.5 pr-8 rounded-lg text-xs appearance-none cursor-pointer"
                >
                  <option :value="false">{{ localeStore.t('base_package') }}</option>
                  <option :value="true">{{ localeStore.t('addon') }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#0C447C]">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5 col-span-2">
              <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('description') }}</label>
              
              <textarea 
                v-if="localeStore.locale === 'ka'"
                rows="2"
                :placeholder="localeStore.t('enter_service_desc_placeholder')"
                v-model="form.descriptionKa"
                class="glass-input w-full p-2.5 rounded-lg text-xs resize-none"
              ></textarea>
              <textarea 
                v-else
                rows="2"
                :placeholder="localeStore.t('enter_service_desc_placeholder')"
                v-model="form.descriptionEn"
                class="glass-input w-full p-2.5 rounded-lg text-xs resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Configuration matrix per category -->
          <div class="space-y-2 border-t border-brand-100 pt-4">
            <h4 class="text-[10px] font-black text-brand-500 uppercase tracking-widest">{{ localeStore.t('pricing_details') }}</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div 
                v-for="item in form.matrix" 
                :key="item.vehicleTypeId"
                class="p-3 bg-brand-100/40 border border-brand-100 rounded-xl space-y-3"
              >
                <span class="text-xs font-bold text-[#0C447C] block">🚗 {{ localeStore.t(item.vehicleTypeName) }}</span>
                
                <div class="space-y-1">
                  <label class="text-[8px] font-bold text-brand-400 uppercase tracking-wide">{{ localeStore.t('price') }} (₾)</label>
                  <input 
                    type="text" 
                    placeholder="25.00"
                    v-model="item.price"
                    class="glass-input w-full p-2 rounded text-xs font-bold"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[8px] font-bold text-brand-400 uppercase tracking-wide">{{ localeStore.t('time_slot') }} ({{ localeStore.t('mins') }})</label>
                  <input 
                    type="number" 
                    placeholder="30"
                    v-model.number="item.durationMinutes"
                    class="glass-input w-full p-2 rounded text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-brand-100">
          <button 
            @click="showModal = false"
            class="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-semibold"
          >
            {{ localeStore.t('cancel') }}
          </button>
          <button 
            @click="submitForm"
            :disabled="submitting"
            class="bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
          >
            <span v-if="submitting" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            {{ modalMode === 'add' ? localeStore.t('save') : localeStore.t('update') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm">
      <div class="glass-panel max-w-sm w-full rounded-2xl p-6 shadow-glass relative space-y-4 text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-rose-50/70 flex items-center justify-center">
          <span class="text-2xl text-rose-500">⚠️</span>
        </div>
        <div>
          <h4 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('delete_service') }}</h4>
          <p class="text-xs text-brand-500 mt-1.5 leading-relaxed">
            {{ localeStore.t('confirm_delete_service') }}
          </p>
        </div>

        <div v-if="deleteError" class="p-2.5 rounded-lg bg-rose-50/70 border border-rose-500/20 text-rose-700 text-[10px] text-left">
          {{ deleteError }}
        </div>

        <div class="flex gap-2">
          <button 
            @click="showDeleteModal = false"
            class="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-bold w-1/2"
          >
            {{ localeStore.t('cancel') }}
          </button>
          <button 
            @click="executeDelete"
            :disabled="isDeleting"
            class="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold w-1/2 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
          >
            <span v-if="isDeleting" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            {{ localeStore.t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'

const bookingStore = useBookingStore()
const localeStore = useLocaleStore()
const matrixError = ref('')

const mainServices = computed(() => {
  return bookingStore.services.filter(s => !s.isAddon)
})

const addonServices = computed(() => {
  return bookingStore.services.filter(s => s.isAddon)
})

function isFirst(service, list) {
  return list.length > 0 && list[0].id === service.id
}

function isLast(service, list) {
  return list.length > 0 && list[list.length - 1].id === service.id
}

async function moveService(service, direction) {
  const isAddon = service.isAddon
  const list = isAddon ? [...addonServices.value] : [...mainServices.value]
  const index = list.findIndex(s => s.id === service.id)
  if (index === -1) return

  if (direction === 'up' && index > 0) {
    const temp = list[index]
    list[index] = list[index - 1]
    list[index - 1] = temp
  } else if (direction === 'down' && index < list.length - 1) {
    const temp = list[index]
    list[index] = list[index + 1]
    list[index + 1] = temp
  } else {
    return
  }

  const newMainIds = (isAddon ? mainServices.value : list).map(s => s.id)
  const newAddonIds = (isAddon ? list : addonServices.value).map(s => s.id)
  const allIds = [...newMainIds, ...newAddonIds]

  const result = await bookingStore.reorderServices(allIds)
  if (!result.success) {
    matrixError.value = result.error || 'Failed to reorder services.'
  }
}

// Modal States
const showModal = ref(false)
const modalMode = ref('add') // 'add' | 'edit'
const editingServiceId = ref('')
const modalError = ref('')
const submitting = ref(false)

const form = ref({
  nameKa: '',
  nameEn: '',
  descriptionKa: '',
  descriptionEn: '',
  isAddon: false,
  matrix: []
})

// Delete States
const showDeleteModal = ref(false)
const deletingService = ref(null)
const deleteError = ref('')
const isDeleting = ref(false)

definePageMeta({
  layout: false
})

onMounted(async () => {
  localeStore.initialize()
  await bookingStore.loadServiceGrid()
})

function getCell(vehicleTypeId, serviceId) {
  return bookingStore.serviceMatrix.find(
    m => m.vehicleTypeId === vehicleTypeId && m.serviceId === serviceId
  )
}

function openAddModal() {
  modalError.value = ''
  modalMode.value = 'add'
  editingServiceId.value = ''
  
  form.value = {
    nameKa: '',
    nameEn: '',
    descriptionKa: '',
    descriptionEn: '',
    isAddon: false,
    matrix: bookingStore.vehicleTypes.map(vt => ({
      vehicleTypeId: vt.id,
      vehicleTypeName: vt.name,
      price: '20.00',
      durationMinutes: 30
    }))
  }
  showModal.value = true
}

function openEditModal(service) {
  try {
    modalError.value = ''
    modalMode.value = 'edit'
    editingServiceId.value = service.id
    
    let nameKa = '';
    let nameEn = '';
    const nameObj = service.title || service.name;
    if (nameObj && typeof nameObj === 'object') {
      nameKa = nameObj.ka || '';
      nameEn = nameObj.en || '';
    } else if (typeof nameObj === 'string') {
      nameKa = localeStore.translations?.ka?.[nameObj] || nameObj;
      nameEn = localeStore.translations?.en?.[nameObj] || nameObj;
    }

    let descKa = '';
    let descEn = '';
    if (service.description && typeof service.description === 'object') {
      descKa = service.description.ka || '';
      descEn = service.description.en || '';
    } else if (typeof service.description === 'string') {
      descKa = localeStore.translations?.ka?.[service.description] || service.description;
      descEn = localeStore.translations?.en?.[service.description] || service.description;
    }

    form.value = {
      nameKa,
      nameEn,
      descriptionKa: descKa,
      descriptionEn: descEn,
      isAddon: service.isAddon,
      matrix: bookingStore.vehicleTypes.map(vt => {
        const match = getCell(vt.id, service.id)
        return {
          vehicleTypeId: vt.id,
          vehicleTypeName: vt.name,
          price: match ? match.price : '20.00',
          durationMinutes: match ? match.durationMinutes : 30
        }
      })
    }
    showModal.value = true
  } catch (err) {
    console.error('Error opening edit modal:', err)
    modalError.value = 'Failed to load service data. ' + (err instanceof Error ? err.message : String(err))
  }
}

async function submitForm() {
  modalError.value = ''
  submitting.value = true
  
  const kaTitle = form.value.nameKa || form.value.nameEn || '';
  const enTitle = form.value.nameEn || form.value.nameKa || '';
  const kaDesc = form.value.descriptionKa || form.value.descriptionEn || null;
  const enDesc = form.value.descriptionEn || form.value.descriptionKa || null;

  const payload = {
    title: {
      ka: kaTitle,
      en: enTitle
    },
    description: {
      ka: kaDesc,
      en: enDesc
    },
    isAddon: form.value.isAddon,
    matrix: form.value.matrix.map(item => ({
      vehicleTypeId: item.vehicleTypeId,
      price: item.price,
      durationMinutes: parseInt(item.durationMinutes) || 30
    }))
  }

  let result
  if (modalMode.value === 'add') {
    result = await bookingStore.createService(payload)
  } else {
    result = await bookingStore.updateService(editingServiceId.value, payload)
  }

  submitting.value = false
  if (result.success) {
    showModal.value = false
  } else {
    modalError.value = result.error || localeStore.t('save_config_error')
  }
}

function confirmDelete(service) {
  deleteError.value = ''
  deletingService.value = service
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deletingService.value) return
  
  isDeleting.value = true
  deleteError.value = ''
  
  const result = await bookingStore.deleteService(deletingService.value.id)
  isDeleting.value = false
  
  if (result.success) {
    showDeleteModal.value = false
    deletingService.value = null
  } else {
    deleteError.value = result.error || localeStore.t('delete_service_error_msg')
  }
}
</script>
