<template>
  <div class="space-y-6">

    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-xl font-bold text-white">{{ localeStore.t('system_accounts') }}</h3>
        <p class="text-brand-500 text-xs mt-1">{{ localeStore.t('accounts_desc') }}</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-2 border border-brand-500/20 hover:border-brand-500/80 bg-brand-500/5 hover:bg-brand-500/10 text-brand-400 hover:text-brand-300 font-bold px-4.5 py-2.5 rounded-xl transition duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xs uppercase tracking-wider whitespace-nowrap shrink-0 shadow-[0_0_15px_rgba(0,217,255,0.05)] hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
      >
        <span>➕</span>
        <span>{{ localeStore.t('add_account') }}</span>
      </button>
    </div>

    <!-- User Database Grid -->
    <div class="glass-panel rounded-2xl overflow-hidden border border-brand-100 shadow-glass">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-brand-100 bg-brand-100/30 text-[10px] uppercase font-bold tracking-wider text-brand-500">
              <th class="py-4 px-6">{{ localeStore.t('user_details') }}</th>
              <th class="py-4 px-6">{{ localeStore.t('security_role') }}</th>
              <th class="py-4 px-6">{{ localeStore.t('created_on') }}</th>
              <th class="py-4 px-6 text-right">{{ localeStore.t('actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-100 text-sm">
            <tr 
              v-for="item in authStore.usersList" 
              :key="item.id" 
              class="hover:bg-white/[0.02] transition duration-200"
            >
              <!-- Name & Initials -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-brand-100 border border-brand-100 flex items-center justify-center font-bold text-brand-400 uppercase">
                    {{ item.username.charAt(0) }}
                  </div>
                  <div>
                    <span class="font-bold text-white flex items-center gap-1.5">
                      {{ item.username }}
                      <span 
                        v-if="authStore.user?.username === item.username"
                        class="text-[9px] bg-brand-100 text-brand-500 px-1.5 py-0.5 rounded font-medium border border-brand-100"
                      >
                        {{ localeStore.t('you') }}
                      </span>
                    </span>
                  </div>
                </div>
              </td>

              <!-- Role Badges -->
              <td class="py-4.5 px-6">
                <span 
                  class="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border inline-block"
                  :class="[item.role === 'admin' ? 'bg-brand-500/10 text-brand-400 border-brand-400/20' : 'bg-brand-100 text-brand-500 border-brand-300/40/50']"
                >
                  {{ item.role === 'admin' ? localeStore.t('administrator') : localeStore.t('manager') }}
                </span>
              </td>

              <!-- Created At -->
              <td class="py-4.5 px-6 text-brand-500 text-xs">
                {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Initial Seed' }}
              </td>

              <!-- Action buttons -->
              <td class="py-4.5 px-6 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="openEditModal(item)"
                    class="p-2 rounded-lg bg-brand-100 hover:bg-slate-750 text-brand-600 hover:text-brand-700 border border-brand-100 transition"
                    :title="localeStore.t('edit')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="confirmDelete(item)"
                    :disabled="isProtected(item)"
                    class="p-2 rounded-lg bg-red-950/20 hover:bg-red-500/10 text-rose-400 hover:text-rose-700 border border-transparent hover:border-red-500/10 transition disabled:opacity-30 disabled:pointer-events-none"
                    :title="localeStore.t('delete')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <!-- 1. Add / Edit User Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 shadow-glass border border-brand-200 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h4 class="text-lg font-bold text-white">
            {{ isEditMode ? localeStore.t('modify_account') : localeStore.t('register_account') }}
          </h4>
          <button @click="closeModal" class="text-brand-500 hover:text-brand-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="modalError" class="mb-4 px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs">
          {{ modalError }}
        </div>

        <form @submit.prevent="saveUser" class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-brand-600 text-xs font-bold uppercase tracking-wider mb-2" for="modal-username">{{ localeStore.t('username') }}</label>
            <input 
              id="modal-username"
              v-model="form.username" 
              type="text" 
              required
              class="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              :placeholder="localeStore.t('username')"
              :disabled="isEditMode" 
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-brand-600 text-xs font-bold uppercase tracking-wider mb-2" for="modal-password">
              {{ isEditMode ? localeStore.t('change_password') : localeStore.t('password') }}
            </label>
            <input 
              id="modal-password"
              v-model="form.password" 
              type="password" 
              :required="!isEditMode"
              class="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              placeholder="••••••••" 
            />
            <span v-if="isEditMode" class="text-[10px] text-brand-500 mt-1 block">{{ localeStore.t('password_desc') }}</span>
          </div>

          <!-- Role selection -->
          <div>
            <label class="block text-brand-600 text-xs font-bold uppercase tracking-wider mb-2" for="modal-role">{{ localeStore.t('system_role') }}</label>
            <select 
              id="modal-role"
              v-model="form.role" 
              required
              class="glass-input w-full px-4 py-2.5 rounded-xl text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="manager">{{ localeStore.t('manager') }}</option>
              <option value="admin">{{ localeStore.t('administrator') }}</option>
            </select>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-3 justify-end pt-4">
            <button 
              type="button" 
              @click="closeModal"
              class="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-sm font-semibold"
            >
              {{ localeStore.t('cancel') }}
            </button>
            <button 
              type="submit"
              class="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-md text-sm"
              :disabled="authStore.loading"
            >
              <span v-if="authStore.loading" class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
              {{ isEditMode ? localeStore.t('update') : localeStore.t('save') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. Delete Confirmation Modal -->
    <div 
      v-if="showDeleteModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-800/40 backdrop-blur-sm"
      @click.self="showDeleteModal = false"
    >
      <div class="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-glass border border-brand-200 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex flex-col items-center text-center space-y-4">
          <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 class="text-base font-bold text-white">{{ localeStore.t('confirm_deletion') }}</h4>
            <p class="text-brand-500 text-xs mt-1">{{ localeStore.t('delete_user_desc') }} <b class="text-white">"{{ deleteTarget?.username }}"</b>?</p>
          </div>
          <div v-if="deleteError" class="p-2.5 rounded-lg bg-rose-50/70 border border-rose-500/20 text-rose-700 text-[10px] text-left w-full">
            {{ deleteError }}
          </div>
          <div class="flex w-full gap-3 justify-center pt-2">
            <button 
              type="button" 
              @click="showDeleteModal = false"
              class="w-1/2 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:text-brand-700 hover:bg-brand-100/40 transition text-xs font-bold"
            >
              {{ localeStore.t('cancel') }}
            </button>
            <button 
              type="button" 
              @click="executeDelete"
              class="w-1/2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md"
              :disabled="authStore.loading"
            >
              {{ localeStore.t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { useLocaleStore } from "../../stores/localeStore";

definePageMeta({
  layout: "admin"
});

const authStore = useAuthStore();
const localeStore = useLocaleStore();

const showModal = ref(false);
const isEditMode = ref(false);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const deleteError = ref("");
const modalError = ref("");

const form = ref({
  id: "",
  username: "",
  password: "",
  role: "manager"
});

const isProtected = (user) => {
  // Prevent deleting oneself
  if (authStore.user?.username === user.username) return true;
  // Prevent deleting initial system admin and manager default accounts
  if (user.username === "admin" || user.username === "manager") return true;
  return false;
};

const openAddModal = () => {
  isEditMode.value = false;
  modalError.value = "";
  form.value = {
    id: "",
    username: "",
    password: "",
    role: "manager"
  };
  showModal.value = true;
};

const openEditModal = (user) => {
  isEditMode.value = true;
  modalError.value = "";
  form.value = {
    id: user.id,
    username: user.username,
    password: "",
    role: user.role
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveUser = async () => {
  modalError.value = "";
  let res;
  
  if (isEditMode.value) {
    const payload = {
      role: form.value.role
    };
    if (form.value.password) {
      payload.password = form.value.password;
    }
    res = await authStore.updateUser(form.value.id, payload);
  } else {
    res = await authStore.createUser({
      username: form.value.username,
      password: form.value.password,
      role: form.value.role
    });
  }

  if (res && res.success) {
    showModal.value = false;
  } else {
    modalError.value = res.error || authStore.error || "An error occurred.";
  }
};

const confirmDelete = (user) => {
  if (isProtected(user)) return;
  deleteTarget.value = user;
  deleteError.value = "";
  showDeleteModal.value = true;
};

const executeDelete = async () => {
  if (!deleteTarget.value) return;
  deleteError.value = "";
  
  const res = await authStore.deleteUser(deleteTarget.value.id);
  if (res && res.success) {
    showDeleteModal.value = false;
    deleteTarget.value = null;
  } else {
    deleteError.value = res.error || authStore.error || "წაშლა ვერ მოხერხდა.";
  }
};

onMounted(async () => {
  localeStore.initialize();
  authStore.initialize();
  await authStore.fetchUsers();
});
</script>
