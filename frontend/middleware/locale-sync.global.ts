import { useLocaleStore } from '~/stores/localeStore'

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/$/, "")

  // Legacy /ge redirect to clean root /
  if (path === "/ge") {
    return navigateTo("/", { redirectCode: 301 })
  }

  // Admin paths are unlocalized
  if (path.startsWith("/admin")) {
    return
  }

  // Sync Pinia localeStore: /en is English, everything else is Georgian (ka)
  const localeStore = useLocaleStore()
  if (path === "/en" || path.startsWith("/en/")) {
    if (localeStore.locale !== 'en') {
      localeStore.setLocale('en')
    }
  } else {
    if (localeStore.locale !== 'ka') {
      localeStore.setLocale('ka')
    }
  }
})
