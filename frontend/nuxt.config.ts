// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/tailwind.css'],
  modules: [
    '@pinia/nuxt'
  ],
  devtools: { enabled: true },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    firebaseAdminDatabaseUrl: process.env.FIREBASE_DATABASE_URL || 'https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app',
    public: {
      apiBase: process.env.API_BASE_URL || 'https://splendor-fakc0rqiu-tomotekashiki.vercel.app/api',
      wsUrl: process.env.WS_URL || 'https://splendor-fakc0rqiu-tomotekashiki.vercel.app',
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyASXXWzR_nJOg1UQjUS63aKzlv4pcpN7ws',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'splendor-1ae02.firebaseapp.com',
      firebaseDatabaseUrl: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || 'splendor-1ae02',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'splendor-1ae02.firebasestorage.app',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1074726020772',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '1:1074726020772:web:194e205455062a69ace831',
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ETS8KC160G',
    }
  },
  devServer: {
    port: 3000
  },
  app: {
    head: {
      title: 'Splendor - Smart Car Wash Booking',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Book your car wash online with real-time bay availability and packages.' },
        { name: 'apple-mobile-web-app-title', content: 'Splendor' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@100..800&display=swap' }
      ]
    }
  }
})
