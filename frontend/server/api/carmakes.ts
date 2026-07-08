import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.public.ninjaApiKey || process.env.NUXT_PUBLIC_NINJA_API_KEY

  if (!apiKey) {
    return { error: 'No API key configured' }
  }

  try {
    const data = await $fetch('https://api.api-ninjas.com/v1/carmakes', {
      headers: { 'X-Api-Key': apiKey }
    })
    return data
  } catch (err: any) {
    console.error('API-Ninjas carmakes fetch failed:', err)
    return { error: err.message || 'Fetch failed' }
  }
})
