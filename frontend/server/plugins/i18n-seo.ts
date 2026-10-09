import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const rawPath = event.path ? event.path.split('?')[0] : ''
    const path = rawPath.replace(/\/$/, '')

    const isEn = path === '/en' || path.startsWith('/en/')
    const isGe = path === '/ge' || path.startsWith('/ge/')

    if (isEn || isGe) {
      const currentLang = isEn ? 'en' : 'ka'
      const canonicalUrl = isEn 
        ? 'https://splendor-beryl.vercel.app/en' 
        : 'https://splendor-beryl.vercel.app/ge'

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
          `<link rel="alternate" hreflang="ka" href="https://splendor-beryl.vercel.app/ge">`,
          `<link rel="alternate" hreflang="en" href="https://splendor-beryl.vercel.app/en">`,
          `<link rel="alternate" hreflang="x-default" href="https://splendor-beryl.vercel.app/ge">`,
          `<meta property="og:url" content="${canonicalUrl}">`
        )
      }
    }
  })
})
