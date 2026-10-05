import { defineNuxtPlugin } from '#app'
import { useCustomerAuthStore } from '~/stores/customerAuthStore'
import { useLocaleStore } from '~/stores/localeStore'
import { useBookingStore } from '~/stores/bookingStore'

export default defineNuxtPlugin(() => {
  const customerAuth = useCustomerAuthStore()
  const localeStore = useLocaleStore()
  const bookingStore = useBookingStore()

  // Initialize stores synchronously on client startup before page components mount
  customerAuth.initialize()
  localeStore.initialize()

  if (typeof window !== 'undefined') {
    try {
      const cached = window.sessionStorage.getItem('splendor_service_grid')
      if (cached) {
        const data = JSON.parse(cached)
        if (data.branches && data.branches.length > 0) {
          bookingStore.vehicleTypes = data.vehicleTypes || []
          bookingStore.services = data.services || []
          bookingStore.serviceMatrix = data.serviceMatrix || []
          bookingStore.washingBays = data.washingBays || []
          bookingStore.branches = data.branches || []
          bookingStore.loadingGrid = false
        }
      }
    } catch (e) {
      console.warn('Failed to restore cached service grid:', e)
    }
  }
})
