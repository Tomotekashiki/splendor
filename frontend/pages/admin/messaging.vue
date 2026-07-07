<template>
  <div class="space-y-6 max-w-5xl">
    <!-- Header -->
    <div>
      <h3 class="text-xl font-bold text-[#0C447C]">📢 {{ localeStore.t('messaging') }}</h3>
      <p class="text-brand-500 text-xs mt-1">
        {{ localeStore.t('messaging_desc') }}
      </p>
    </div>

    <!-- Alert Banners -->
    <div 
      v-if="successMessage" 
      class="px-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {{ successMessage }}
    </div>
    <div 
      v-if="errorMessage" 
      class="px-4 py-3.5 rounded-xl bg-rose-50 border border-rose-500/20 text-rose-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {{ errorMessage }}
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Form Panel -->
      <div class="lg:col-span-2 glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass space-y-6">
        <h4 class="text-sm font-black text-[#0C447C] uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> {{ localeStore.t('new_message') }}
        </h4>

        <form @submit.prevent="sendNotification" class="space-y-5">
          <!-- Title Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-black text-brand-600 uppercase tracking-widest">📌 {{ localeStore.t('notification_title') }}</label>
            <input 
              type="text"
              v-model="title"
              :placeholder="localeStore.t('notification_title_placeholder')"
              required
              class="w-full glass-input px-4 py-3 rounded-xl text-xs placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <!-- Image Upload Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-black text-brand-600 uppercase tracking-widest">🖼️ {{ localeStore.t('notification_image') }}</label>
            <div class="space-y-3">
              <!-- File Selector Box -->
              <div 
                v-if="!imageUrl"
                class="border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-2xl p-6 transition duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-slate-50"
                @click="triggerFileSelect"
              >
                <span class="text-3xl">📤</span>
                <span class="text-xs font-bold text-brand-600">{{ localeStore.t('select_image_upload') }}</span>
                <span class="text-[10px] text-brand-400">PNG, JPG, JPEG (Max. 5MB)</span>
                <input 
                  type="file" 
                  ref="fileInput" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleFileChange" 
                />
              </div>

              <!-- Uploading state -->
              <div v-if="uploadingImage" class="flex items-center gap-2 p-3 bg-brand-50/50 border border-brand-100 rounded-xl">
                <span class="animate-spin h-4.5 w-4.5 border-2 border-brand-500 border-t-transparent rounded-full shrink-0"></span>
                <span class="text-xs font-bold text-brand-600 animate-pulse">{{ localeStore.t('image_uploading') }}</span>
              </div>

              <!-- Preview with Remove action -->
              <div v-if="imageUrl && !uploadingImage" class="relative group rounded-2xl overflow-hidden border border-brand-200/50 max-w-[200px] shadow-sm">
                <img :src="imageUrl" class="w-full h-auto object-cover max-h-[140px]" alt="Notification Image Preview" />
                <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                  <button 
                    type="button" 
                    @click="removeUploadedImage" 
                    class="bg-rose-500 text-white rounded-xl py-1.5 px-3 text-[10px] font-bold hover:bg-rose-600 hover:scale-[1.05] transition shadow-md"
                  >
                    🗑️ {{ localeStore.t('delete_btn') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Body Textarea -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-black text-brand-600 uppercase tracking-widest">💬 {{ localeStore.t('notification_body') }}</label>
            <textarea 
              v-model="body"
              :placeholder="localeStore.t('notification_body_placeholder')"
              required
              rows="4"
              class="w-full glass-input px-4 py-3 rounded-xl text-xs placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit"
            :disabled="sending"
            class="w-full bg-brand-gradient hover:opacity-95 text-white rounded-xl py-3 px-4 text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
          >
            <span v-if="sending" class="animate-spin h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full"></span>
            <span v-else>✈️ {{ localeStore.t('send_notification') }}</span>
          </button>
        </form>
      </div>

      <!-- Stats Panel -->
      <div class="space-y-6">
        <div class="glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass space-y-4">
          <h4 class="text-sm font-black text-[#0C447C] uppercase tracking-wider flex items-center gap-2">
            <span>📈</span> {{ localeStore.t('active_devices') }}
          </h4>

          <div v-if="loadingStats" class="space-y-3 py-2">
            <div class="h-10 bg-slate-100/50 rounded-xl animate-pulse"></div>
            <div class="h-10 bg-slate-100/50 rounded-xl animate-pulse"></div>
          </div>

          <div v-else class="space-y-3.5">
            <!-- Customer Devices -->
            <div class="bg-brand-50/30 border border-brand-100/50 rounded-xl p-4 flex justify-between items-center bg-gradient-to-tr from-brand-500/5 to-transparent">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📱</span>
                <div>
                  <p class="text-xs font-extrabold text-brand-800">{{ localeStore.t('active_customers') }}</p>
                  <p class="text-[10px] text-brand-500">{{ localeStore.t('customer_browsers') }}</p>
                </div>
              </div>
              <span class="text-xl font-black text-brand-700 bg-white border border-brand-100 px-3 py-1 rounded-xl shadow-sm">
                {{ stats.customerCount }}
              </span>
            </div>

            <button 
              @click="loadStats"
              class="w-full border border-brand-200 hover:bg-slate-50 text-brand-600 rounded-xl py-2 px-3 text-[10px] font-bold transition duration-200 flex items-center justify-center gap-1.5"
            >
              🔄 {{ localeStore.t('refresh_data') }}
            </button>
          </div>
        </div>

        <!-- Info Panel -->
        <div class="glass-panel p-6 rounded-2xl border border-brand-100/50 shadow-glass bg-gradient-to-tr from-brand-500/5 to-transparent space-y-3">
          <h5 class="text-xs font-black text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>ℹ️</span> {{ localeStore.t('info_tip') }}
          </h5>
          <p class="text-[11px] text-brand-600 leading-relaxed">
            {{ localeStore.t('info_tip_desc') }}
          </p>
          <p class="text-[11px] text-brand-600 leading-relaxed font-bold">
            {{ localeStore.t('info_tip_cleanup') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLocaleStore } from '~/stores/localeStore'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({
  layout: "admin"
})

const localeStore = useLocaleStore()
const authStore = useAuthStore()

const title = ref('')
const imageUrl = ref('')
const body = ref('')
const targetGroup = ref('customers')
const sending = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const fileInput = ref(null)
const uploadingImage = ref(false)

const loadingStats = ref(true)
const stats = ref({
  adminCount: 0,
  customerCount: 0,
  totalCount: 0
})

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = localeStore.t('image_size_error')
    return
  }

  uploadingImage.value = true
  errorMessage.value = ''

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Data = e.target.result
      try {
        const config = useRuntimeConfig()
        const res = await $fetch(`${config.public.apiBase}/auth/admin/upload-notification-image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          },
          body: {
            fileName: file.name,
            fileData: base64Data
          }
        })
        if (res.success && res.imageUrl) {
          imageUrl.value = res.imageUrl
        } else {
          errorMessage.value = localeStore.t('image_upload_failed')
        }
      } catch (err) {
        console.error("Upload fetch failed:", err)
        errorMessage.value = err.data?.error || localeStore.t('image_server_error')
      } finally {
        uploadingImage.value = false
      }
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error("Reader failed:", err)
    errorMessage.value = localeStore.t('image_reader_failed')
    uploadingImage.value = false
  }
}

function removeUploadedImage() {
  imageUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function loadStats() {
  loadingStats.value = true
  try {
    const config = useRuntimeConfig()
    const data = await $fetch(`${config.public.apiBase}/auth/admin/messaging-stats`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    if (data.success) {
      stats.value = {
        adminCount: data.adminCount || 0,
        customerCount: data.customerCount || 0,
        totalCount: data.totalCount || 0
      }
    }
  } catch (err) {
    console.error("Failed to load messaging statistics:", err)
  } finally {
    loadingStats.value = false
  }
}

async function sendNotification() {
  if (!title.value.trim() || !body.value.trim()) return

  sending.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const config = useRuntimeConfig()
    const result = await $fetch(`${config.public.apiBase}/auth/admin/send-custom-push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: {
        title: title.value.trim(),
        body: body.value.trim(),
        imageUrl: imageUrl.value.trim(),
        target: targetGroup.value
      }
    })

    if (result.success) {
      if (result.sentCount === 0) {
        successMessage.value = localeStore.t('notif_sent_empty')
      } else {
        successMessage.value = localeStore.t('notif_sent_success').replace('{count}', result.successCount || 0)
      }
      title.value = ''
      imageUrl.value = ''
      body.value = ''
      await loadStats() // reload stats to clean up failed tokens
    } else {
      errorMessage.value = localeStore.t('notif_sent_failed')
    }
  } catch (err) {
    console.error("Failed to send push notification:", err)
    errorMessage.value = err.data?.error || localeStore.t('notif_sent_failed')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
