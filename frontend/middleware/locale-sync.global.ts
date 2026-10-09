import { useLocaleStore } from '~/stores/localeStore'

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/$/, "")

  // Root redirect: '/' -> '/ge' (or '/en' based on preference)
  if (path === "" || path === "/") {
    const cookie = useCookie('splendor_locale')
    const target = cookie.value === 'en' ? '/en' : '/ge'
    return navigateTo(target, { redirectCode: 301 })
  }

  // Sync Pinia localeStore with route prefix
  const localeStore = useLocaleStore()
  if (path === "/ge" || path.startsWith("/ge/")) {
    if (localeStore.locale !== 'ka') {
      localeStore.setLocale('ka')
    }
  } else if (path === "/en" || path.startsWith("/en/")) {
    if (localeStore.locale !== 'en') {
      localeStore.setLocale('en')
    }
  }
})
