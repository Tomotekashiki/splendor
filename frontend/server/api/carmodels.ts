import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const make = query.make as string
  if (!make) {
    return { error: 'Make parameter is required' }
  }

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:4000/api'

  try {
    const response: any = await $fetch(`${apiBase}/settings/vehicles/models?make=${encodeURIComponent(make)}`)
    if (response && response.success && Array.isArray(response.models)) {
      // Map to objects with { model: string } for minimal client-side changes
      return response.models.map((name: string) => ({ model: name }))
    }
    return { error: 'Invalid response format from backend' }
  } catch (err: any) {
    console.error(`Nuxt proxy carmodels fetch failed for ${make}:`, err)
    return { error: err.message || 'Fetch failed' }
  }
})
