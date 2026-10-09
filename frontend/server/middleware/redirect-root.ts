import { defineEventHandler, sendRedirect, getCookie } from 'h3'

export default defineEventHandler((event) => {
  const url = event.path ? event.path.split('?')[0] : ''
  const normalized = url.replace(/\/$/, '')

  // Only redirect exact root path
  if (normalized === '' || normalized === '/') {
    const cookie = getCookie(event, 'splendor_locale')
    const target = cookie === 'en' ? '/en' : '/ge'
    const query = event.path.includes('?') ? event.path.slice(event.path.indexOf('?')) : ''
    return sendRedirect(event, `${target}${query}`, 301)
  }
})
