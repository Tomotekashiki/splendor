<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Header Toolbar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-100 pb-5">
        <div>
          <h3 class="font-bold text-white text-base">{{ localeStore.t('manage_branches') }}</h3>
          <p class="text-xs text-brand-400 mt-1 font-medium">Create, update, and manage car wash branches and operational sites</p>
        </div>

        <button 
          @click="openAddModal"
          class="flex items-center gap-2 border border-brand-500/20 hover:border-brand-500/80 bg-brand-500/5 hover:bg-brand-500/10 text-brand-400 hover:text-brand-300 font-bold px-4.5 py-2.5 rounded-xl transition duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xs uppercase tracking-wider whitespace-nowrap shrink-0 shadow-[0_0_15px_rgba(0,217,255,0.05)] hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
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
      <div v-if="bookingStore.loadingGrid" class="text-center py-12">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-sm text-brand-500 font-semibold uppercase tracking-wider">{{ localeStore.t('syncing_stats') }}</p>
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
                <th class="pb-4 font-semibold w-1/3">{{ localeStore.t('branch_name') }}</th>
                <th class="pb-4 font-semibold w-2/5">{{ localeStore.t('branch_address') }}</th>
                <th class="pb-4 font-semibold text-center">{{ localeStore.t('branch_status') }}</th>
                <th class="pb-4 font-semibold text-right">{{ localeStore.t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-100 text-brand-600">
              <tr 
                v-for="branch in bookingStore.branches" 
                :key="branch.id"
                class="hover:bg-brand-100/40 transition duration-150"
              >
                <!-- Branch Name -->
                <td class="py-4 align-middle font-bold text-white text-sm">
                  {{ localeStore.t(branch.name) }}
                </td>

                <!-- Branch Address -->
                <td class="py-4 align-middle text-brand-500 font-light">
                  {{ branch.address ? localeStore.t(branch.address) : '-' }}
                </td>

                <!-- Status Badge -->
                <td class="py-4 text-center align-middle">
                  <span 
                    class="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border inline-block"
                    :class="[
                      branch.isActive !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' 
                        : 'bg-rose-50/70 text-rose-450 border-rose-450/20'
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
                      class="px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-brand-700 font-bold transition text-[10px]"
                    >
                      {{ localeStore.t('edit') }}
                    </button>
                    <button 
                      @click="confirmDelete(branch)"
                      class="px-2.5 py-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-500 text-rose-400 hover:text-brand-700 font-bold transition text-[10px]"
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
            <h4 class="font-bold text-white text-lg">
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
              type="text" 
              placeholder="e.g. Saburtalo Branch"
              v-model="form.name"
              class="w-full p-2.5 rounded-lg bg-white border border-brand-200 text-brand-700 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <!-- Address -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('branch_address') }}</label>
            <input 
              type="text" 
              placeholder="e.g. 45 Vazha-Pshavela Ave."
              v-model="form.address"
              class="w-full p-2.5 rounded-lg bg-white border border-brand-200 text-brand-700 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <!-- Status Dropdown -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-brand-500 uppercase tracking-wide">{{ localeStore.t('branch_status') }}</label>
            <select 
              v-model="form.isActive"
              class="w-full p-2.5 rounded-lg bg-white border border-brand-200 text-brand-700 focus:outline-none focus:border-brand-500 text-xs appearance-none bg-white cursor-pointer"
            >
              <option :value="true">{{ localeStore.t('active') }}</option>
              <option :value="false">{{ localeStore.t('inactive') }}</option>
            </select>
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
            class="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-md text-xs flex items-center gap-1.5"
          >
            <span v-if="submitting" class="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full"></span>
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
          <h4 class="font-bold text-white text-base">{{ localeStore.t('delete_branch') }}</h4>
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
            class="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold w-1/2 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
          >
            <span v-if="isDeleting" class="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full"></span>
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
  name: '',
  address: '',
  isActive: true
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

function openAddModal() {
  modalError.value = ''
  modalMode.value = 'add'
  editingBranchId.value = ''
  form.value = {
    name: '',
    address: '',
    isActive: true
  }
  showModal.value = true
}

function openEditModal(branch) {
  modalError.value = ''
  modalMode.value = 'edit'
  editingBranchId.value = branch.id
  form.value = {
    name: localeStore.t(branch.name),
    address: branch.address ? localeStore.t(branch.address) : '',
    isActive: branch.isActive !== false
  }
  showModal.value = true
}

async function submitForm() {
  modalError.value = ''
  submitting.value = true
  
  const payload = {
    name: form.value.name,
    address: form.value.address || null,
    isActive: form.value.isActive
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
</script>
