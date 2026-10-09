import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const rawPath = event.path ? event.path.split('?')[0] : ''
    const path = rawPath.replace(/\/$/, '')

    // Admin routes are not localized
    if (path.startsWith('/admin')) {
      return
    }

    const isEn = path === '/en' || path.startsWith('/en/')
    const currentLang = isEn ? 'en' : 'ka'
    const canonicalUrl = isEn 
      ? 'https://splendor-beryl.vercel.app/en' 
      : 'https://splendor-beryl.vercel.app/'

    // Update <html lang="...">
    if (Array.isArray(html.htmlAttrs)) {
      html.htmlAttrs = html.htmlAttrs.map((attr: string) => {
        if (attr.includes('lang=')) {
          return ` lang="${currentLang}"`
        }
        return attr
      })
    }

    // Inject canonical and multilingual hreflang links into SSR <head>
    if (Array.isArray(html.head)) {
      html.head.push(
        `<link rel="canonical" href="${canonicalUrl}">`,
        `<link rel="alternate" hreflang="ka" href="https://splendor-beryl.vercel.app/">`,
        `<link rel="alternate" hreflang="en" href="https://splendor-beryl.vercel.app/en">`,
        `<link rel="alternate" hreflang="x-default" href="https://splendor-beryl.vercel.app/">`,
        `<meta property="og:url" content="${canonicalUrl}">`
      )
    }
  })
})
