import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const make = query.make as string
  if (!make) {
    return { error: 'Make parameter is required' }
  }

  const config = useRuntimeConfig()
  const apiKey = config.public.ninjaApiKey || process.env.NUXT_PUBLIC_NINJA_API_KEY

  if (!apiKey) {
    return { error: 'No API key configured' }
  }

  try {
    const data = await $fetch(`https://api.api-ninjas.com/v1/cars?make=${make.toLowerCase()}`, {
      headers: { 'X-Api-Key': apiKey }
    })
    return data
  } catch (err: any) {
    console.error(`API-Ninjas cars fetch failed for ${make}:`, err)
    return { error: err.message || 'Fetch failed' }
  }
})
