import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:4000/api'

  try {
    const response: any = await $fetch(`${apiBase}/settings/vehicles/makes`)
    if (response && response.success && Array.isArray(response.makes)) {
      // Return flat list of names for compatibility with the frontend dropdown
      return response.makes.map((m: any) => m.manName)
    }
    return { error: 'Invalid response format from backend' }
  } catch (err: any) {
    console.error('Nuxt proxy carmakes fetch failed:', err)
    return { error: err.message || 'Fetch failed' }
  }
})
