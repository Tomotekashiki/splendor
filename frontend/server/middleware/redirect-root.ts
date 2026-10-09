import { defineEventHandler, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const url = event.path ? event.path.split('?')[0] : ''
  const normalized = url.replace(/\/$/, '')

  // Legacy /ge redirect to clean root /
  if (normalized === '/ge') {
    const query = event.path.includes('?') ? event.path.slice(event.path.indexOf('?')) : ''
    return sendRedirect(event, `/${query}`, 301)
  }
})
