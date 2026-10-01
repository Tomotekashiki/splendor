import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    if (typeof response.body === 'string') {
      // Defer render-blocking entry CSS so browser does not halt initial render
      response.body = response.body.replace(
        /<link(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'](\/_nuxt\/[^"']+\.css)["'])[^>]*>/gi,
        '<link rel="preload" as="style" href="$1"><link rel="stylesheet" href="$1" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
      )
    }
  })
})
