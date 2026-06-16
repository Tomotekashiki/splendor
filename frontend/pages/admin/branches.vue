<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Header Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div>
          <h3 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('manage_branches') }}</h3>
          <p class="text-xs text-brand-500 mt-1 font-medium">Create, update, and manage car wash branches and operational sites</p>
        </div>

        <button 
          @click="openAddModal"
          class="bg-brand-500 text-white flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-brand-500/10"
        >
          <span>➕</span>
          <span>{{ localeStore.t('add_branch') }}</span>
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="branchError" class="p-4 rounded-xl bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs flex justify-between items-center">
        <span>⚠️ {{ branchError }}</span>
        <button @click="branchError = ''" class="text-rose-400 font-bold text-sm">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="bookingStore.loadingGrid" class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden min-h-[300px]">
        <div class="overflow-x-auto">
          <div class="border-b border-brand-100 pb-3 flex justify-between animate-pulse">
            <div class="w-1/4 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-1/3 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-12 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-16 h-3 bg-slate-200/80 rounded"></div>
            <div class="w-24 h-3 bg-slate-200/80 rounded"></div>
          </div>
          <div class="divide-y divide-brand-100">
            <div v-for="n in 4" :key="n" class="py-4 flex justify-between items-center animate-pulse">
              <div class="w-1/4 h-3 bg-slate-200/60 rounded"></div>
              <div class="w-1/3 h-3 bg-slate-200/50 rounded"></div>
              <div class="w-8 h-3 bg-slate-200/60 rounded"></div>
              <div class="w-16 h-4.5 bg-slate-200/50 rounded-full"></div>
              <div class="w-24 h-6 bg-slate-200/40 rounded-lg"></div>
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

      <!-- Branches List Card -->
      <div v-else class="glass-panel rounded-2xl p-6 shadow-glass relative overflow-hidden">
        <div v-if="bookingStore.branches.length === 0" class="text-center py-16">
          <span class="text-3xl">🏢</span>
          <p class="text-xs text-brand-500 font-bold mt-2">{{ localeStore.t('no_branches') }}</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr class="border-b border-brand-100 text-brand-500 font-bold uppercase tracking-wider">
                <th class="pb-4 font-semibold w-16 text-center">{{ localeStore.t('order') }}</th>
                <th class="pb-4 font-semibold w-1/4">{{ localeStore.t('branch_name') }}</th>
                <th class="pb-4 font-semibold w-1/3">{{ localeStore.t('branch_address') }}</th>
                <th class="pb-4 font-semibold text-center w-1/6">{{ localeStore.t('bays') }}</th>
                <th class="pb-4 font-semibold text-center w-1/6">{{ localeStore.t('branch_status') }}</th>
                <th class="pb-4 font-semibold text-right w-1/6">{{ localeStore.t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-100 text-brand-600">
              <tr 
                v-for="branch in bookingStore.branches" 
                :key="branch.id"
                class="hover:bg-brand-100/30 transition duration-150"
              >
                <!-- Reordering controls -->
                <td class="py-4 align-middle text-center">
                  <div class="flex items-center justify-center gap-0.5">
                    <button 
                      @click="moveBranch(branch, 'up')" 
                      :disabled="isFirst(branch, bookingStore.branches)"
                      class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                      title="Move Up"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button 
                      @click="moveBranch(branch, 'down')" 
                      :disabled="isLast(branch, bookingStore.branches)"
                      class="p-1 text-brand-500 hover:text-brand-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-brand-100/50 rounded transition duration-150"
                      title="Move Down"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                </td>

                <!-- Branch Name -->
                <td class="py-4 align-middle font-bold text-[#0C447C] text-sm">
                  {{ localeStore.t(branch.name) }}
                </td>

                <!-- Branch Address -->
                <td class="py-4 align-middle text-brand-500 font-light">
                  {{ branch.address ? localeStore.t(branch.address) : '-' }}
                </td>

                <!-- Washing Bays Count -->
                <td class="py-4 text-center align-middle font-bold text-[#0C447C]">
                  {{ getBaysCount(branch.id) }}
                </td>

                <!-- Status Badge -->
                <td class="py-4 text-center align-middle">
                  <span 
                    class="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border inline-block"
                    :class="[
                      branch.isActive !== false
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-450/20' 
                        : 'bg-rose-50 text-rose-600 border-rose-250/20'
                    ]"
                  >
                    {{ branch.isActive !== false ? localeStore.t('active') : localeStore.t('inactive') }}
                  </span>
                </td>

                <!-- Action buttons -->
                <td class="py-4 text-right align-middle">
                  <div class="flex justify-end gap-2">
                    <button 
                      @click="openEditModal(branch)"
                      class="px-2.5 py-1.5 rounded-lg border border-brand-200 hover:border-brand-500 bg-brand-100/40 hover:bg-brand-500 text-brand-600 hover:text-white font-bold transition duration-200 text-[10px]"
                    >
                      {{ localeStore.t('edit') }}
                    </button>
                    <button 
                      @click="confirmDelete(branch)"
                      class="px-2.5 py-1.5 rounded-lg border border-rose-250 hover:border-rose-500 bg-rose-50/70 hover:bg-rose-500 text-rose-600 hover:text-white font-bold transition duration-200 text-[10px]"
                    >
                      {{ localeStore.t('delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal Overlay -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm">
      <div class="glass-panel max-w-md w-full rounded-2xl p-6 shadow-glass relative space-y-4">
        <div class="flex justify-between items-center border-b border-brand-100 pb-3">
          <div>
            <h4 class="font-bold text-[#0C447C] text-lg">
              {{ modalMode === 'add' ? localeStore.t('add_branch') : localeStore.t('edit_branch') }}
            </h4>
            <p class="text-[10px] text-brand-500 font-semibold tracking-wider uppercase mt-0.5">Define location details and status</p>
          </div>
          <button @click="showModal = false" class="text-brand-500 hover:text-brand-700 text-lg">✕</button>
        </div>

        <div v-if="modalError" class="p-3 rounded-lg bg-rose-50/70 border border-rose-500/20 text-rose-700 text-xs">
          ⚠️ {{ modalError }}
        </div>

        <div class="space-y-4">
          <!-- Name -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('branch_name') }}</label>
            <input 
              v-if="localeStore.locale === 'ka'"
              type="text" 
              placeholder="მაგ. საბურთალოს ფილიალი"
              v-model="form.nameKa"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
            <input 
              v-else
              type="text" 
              placeholder="e.g. Saburtalo Branch"
              v-model="form.nameEn"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
          </div>

          <!-- Address -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('branch_address') }}</label>
            <input 
              v-if="localeStore.locale === 'ka'"
              type="text" 
              placeholder="მაგ. ვაჟა-ფშაველას გამზ. 45"
              v-model="form.addressKa"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
            <input 
              v-else
              type="text" 
              placeholder="e.g. 45 Vazha-Pshavela Ave."
              v-model="form.addressEn"
              class="glass-input w-full p-2.5 rounded-lg text-xs"
            />
          </div>

          <!-- Washing Bays Count -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('bays') }}</label>
            <input 
              type="number" 
              min="1" 
              max="10"
              placeholder="e.g. 3"
              v-model.number="form.washingBaysCount"
              class="glass-input w-full p-2.5 rounded-lg text-xs font-bold text-[#0C447C]"
            />
          </div>

          <!-- Status Dropdown -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('branch_status') }}</label>
            <div class="relative">
              <select 
                v-model="form.isActive"
                class="glass-input w-full p-2.5 pr-8 rounded-lg text-xs appearance-none cursor-pointer"
              >
                <option :value="true">{{ localeStore.t('active') }}</option>
                <option :value="false">{{ localeStore.t('inactive') }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#0C447C]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
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
            <span v-if="submitting" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
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
          <h4 class="font-bold text-[#0C447C] text-base">{{ localeStore.t('delete_branch') }}</h4>
          <p class="text-xs text-brand-500 mt-1.5 leading-relaxed">
            {{ localeStore.t('confirm_delete_branch') }}
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
            <span v-if="isDeleting" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            {{ localeStore.t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import { useLocaleStore } from '~/stores/localeStore'

const bookingStore = useBookingStore()
const localeStore = useLocaleStore()
const branchError = ref('')

// Modal states
const showModal = ref(false)
const modalMode = ref('add') // 'add' | 'edit'
const editingBranchId = ref('')
const modalError = ref('')
const submitting = ref(false)

const form = ref({
  nameKa: '',
  nameEn: '',
  addressKa: '',
  addressEn: '',
  isActive: true,
  washingBaysCount: 1
})

// Delete states
const showDeleteModal = ref(false)
const deletingBranch = ref(null)
const deleteError = ref('')
const isDeleting = ref(false)

definePageMeta({
  layout: false
})

onMounted(async () => {
  localeStore.initialize()
  await bookingStore.loadServiceGrid()
})

function getBaysCount(branchId) {
  return bookingStore.washingBays.filter(b => b.branchId === branchId).length
}

function openAddModal() {
  modalError.value = ''
  modalMode.value = 'add'
  editingBranchId.value = ''
  form.value = {
    nameKa: '',
    nameEn: '',
    addressKa: '',
    addressEn: '',
    isActive: true,
    washingBaysCount: 1
  }
  showModal.value = true
}

function openEditModal(branch) {
  modalError.value = ''
  modalMode.value = 'edit'
  editingBranchId.value = branch.id

  let nameKa = ''
  let nameEn = ''
  const nameObj = branch.name
  if (nameObj && typeof nameObj === 'object') {
    nameKa = nameObj.ka || ''
    nameEn = nameObj.en || ''
  } else if (typeof nameObj === 'string') {
    nameKa = localeStore.translations?.ka?.[nameObj] || nameObj
    nameEn = localeStore.translations?.en?.[nameObj] || nameObj
  }

  let addressKa = ''
  let addressEn = ''
  const addrObj = branch.address
  if (addrObj && typeof addrObj === 'object') {
    addressKa = addrObj.ka || ''
    addressEn = addrObj.en || ''
  } else if (typeof addrObj === 'string') {
    addressKa = localeStore.translations?.ka?.[addrObj] || addrObj
    addressEn = localeStore.translations?.en?.[addrObj] || addrObj
  }

  form.value = {
    nameKa,
    nameEn,
    addressKa,
    addressEn,
    isActive: branch.isActive !== false,
    washingBaysCount: getBaysCount(branch.id)
  }
  showModal.value = true
}

async function submitForm() {
  modalError.value = ''
  submitting.value = true
  
  const kaName = form.value.nameKa || form.value.nameEn || '';
  const enName = form.value.nameEn || form.value.nameKa || '';
  const kaAddress = form.value.addressKa || form.value.addressEn || null;
  const enAddress = form.value.addressEn || form.value.addressKa || null;

  const payload = {
    name: {
      ka: kaName,
      en: enName
    },
    address: (kaAddress || enAddress) ? {
      ka: kaAddress,
      en: enAddress
    } : null,
    isActive: form.value.isActive,
    washingBaysCount: form.value.washingBaysCount || 1
  }

  let result
  if (modalMode.value === 'add') {
    result = await bookingStore.createBranch(payload)
  } else {
    result = await bookingStore.updateBranch(editingBranchId.value, payload)
  }

  submitting.value = false
  if (result.success) {
    showModal.value = false
  } else {
    modalError.value = result.error || 'Failed to save configuration.'
  }
}

function confirmDelete(branch) {
  deleteError.value = ''
  deletingBranch.value = branch
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deletingBranch.value) return
  
  isDeleting.value = true
  deleteError.value = ''
  
  const result = await bookingStore.deleteBranch(deletingBranch.value.id)
  isDeleting.value = false
  
  if (result.success) {
    showDeleteModal.value = false
    deletingBranch.value = null
  } else {
    deleteError.value = result.error || 'Deletion failed.'
  }
}

function isFirst(branch, list) {
  return list.length > 0 && list[0].id === branch.id
}

function isLast(branch, list) {
  return list.length > 0 && list[list.length - 1].id === branch.id
}

async function moveBranch(branch, direction) {
  const list = [...bookingStore.branches]
  const index = list.findIndex(b => b.id === branch.id)
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

  const newIds = list.map(b => b.id)
  const result = await bookingStore.reorderBranches(newIds)
  if (!result.success) {
    branchError.value = result.error || 'Failed to reorder branches.'
  }
}
</script>
