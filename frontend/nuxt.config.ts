// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/tailwind.css'],
  modules: [
    '@pinia/nuxt'
  ],
  devtools: { enabled: true },
  features: {
    inlineStyles: true
  },
  experimental: {
    payloadExtraction: false,
    treeshakeClientTypes: true
  },
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) {
              return 'firebase';
            }
            if (id.includes('node_modules/socket.io-client')) {
              return 'socket-io';
            }
          }
        }
      }
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    firebaseAdminDatabaseUrl: process.env.FIREBASE_DATABASE_URL || 'https://splendor-1ae02-default-rtdb.europe-west1.firebasedatabase.app',
    public: {
      apiBase: process.env.API_BASE_URL || 'https://splendor-admin.vercel.app/api',
      wsUrl: process.env.WS_URL || 'https://splendor-admin.vercel.app',
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
      htmlAttrs: {
        lang: 'ka'
      },
      title: 'Splendor - ჭკვიანი ავტოსამრეცხაო | ონლაინ ჯავშანი',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'დაჯავშნეთ ავტოსამრეცხაოს ბოქსი ონლაინ რეალურ დროში. აირჩიეთ ფილიალი, მანქანის მოდელი, სერვისების პაკეტი და მოსახერხებელი დრო რიგში დგომის გარეშე.' },
        { name: 'keywords', content: 'ავტოსამრეცხაო, მანქანის რეცხვა, ავტოსამრეცხაო თბილისი, ონლაინ ჯავშანი, დითეილინგი, ქიმწმენდა, splendor car wash, car wash booking tbilisi' },
        { name: 'theme-color', content: '#0C447C' },
        { name: 'apple-mobile-web-app-title', content: 'Splendor' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        // Open Graph
        { property: 'og:site_name', content: 'Splendor Car Wash' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Splendor - ჭკვიანი ავტოსამრეცხაო | ონლაინ ჯავშანი' },
        { property: 'og:description', content: 'დაჯავშნეთ ავტოსამრეცხაოს ბოქსი ონლაინ რეალურ დროში. აირჩიეთ ფილიალი, მანქანის მოდელი, სერვისების პაკეტი და მოსახერხებელი დრო რიგში დგომის გარეშე.' },
        { property: 'og:url', content: 'https://splendor-beryl.vercel.app/' },
        { property: 'og:image', content: 'https://splendor-beryl.vercel.app/images/og-banner.jpg' },
        { property: 'og:image:secure_url', content: 'https://splendor-beryl.vercel.app/images/og-banner.jpg' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1920' },
        { property: 'og:image:height', content: '1080' },
        { property: 'og:image:alt', content: 'Splendor ჭკვიანი ავტოსამრეცხაო - ონლაინ ჯავშანი' },
        { property: 'og:locale', content: 'ka_GE' },
        { property: 'og:locale:alternate', content: 'en_US' },
        // Twitter Cards
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Splendor - ჭკვიანი ავტოსამრეცხაო | ონლაინ ჯავშანი' },
        { name: 'twitter:description', content: 'დაჯავშნეთ მანქანის რეცხვა და დითეილინგი ონლაინ რეალურ დროში რიგში დგომის გარეშე.' },
        { name: 'twitter:image', content: 'https://splendor-beryl.vercel.app/images/og-banner.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://splendor-beryl.vercel.app/' },
        { rel: 'alternate', hreflang: 'ka', href: 'https://splendor-beryl.vercel.app/' },
        { rel: 'alternate', hreflang: 'en', href: 'https://splendor-beryl.vercel.app/' },
        { rel: 'alternate', hreflang: 'x-default', href: 'https://splendor-beryl.vercel.app/' },
        { rel: 'preload', as: 'image', type: 'image/webp', href: '/images/carwash-bg-mobile.webp', media: '(max-width: 640px)' },
        { rel: 'preload', as: 'image', type: 'image/webp', href: '/images/carwash-bg.webp', media: '(min-width: 641px)' },
        { rel: 'preconnect', href: 'https://splendor-admin.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://splendor-admin.vercel.app' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/google-sans-latin.woff2', crossorigin: 'anonymous' }
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AutoWash',
            'name': 'Splendor Car Wash',
            'alternateName': 'Splendor - ჭკვიანი ავტოსამრეცხაო',
            'description': 'ჭკვიანი ავტოსამრეცხაოს ონლაინ ჯავშნის პლატფორმა რეალურ დროში.',
            'url': 'https://splendor-beryl.vercel.app/',
            'logo': 'https://splendor-beryl.vercel.app/apple-touch-icon.png',
            'image': 'https://splendor-beryl.vercel.app/images/og-banner.jpg',
            'telephone': '+995322000000',
            'priceRange': '₾₾',
            'currenciesAccepted': 'GEL',
            'paymentAccepted': 'Cash, Credit Card, Online',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': 'Tbilisi',
              'addressCountry': 'GE'
            },
            'geo': {
              '@type': 'GeoCoordinates',
              'latitude': 41.7151,
              'longitude': 44.8271
            },
            'openingHoursSpecification': [
              {
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                'opens': '09:00',
                'closes': '21:00'
              }
            ],
            'hasOfferCatalog': {
              '@type': 'OfferCatalog',
              'name': 'სამრეცხაო სერვისები',
              'itemListElement': [
                {
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': 'Service',
                    'name': 'ექსპრეს რეცხვა (Express Wash)'
                  }
                },
                {
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': 'Service',
                    'name': 'სტანდარტული რეცხვა (Standard Wash)'
                  }
                },
                {
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': 'Service',
                    'name': 'პრემიუმ დითეილინგი და ქიმწმენდა (Premium Detailing)'
                  }
                }
              ]
            }
          })
        }
      ],
      style: [
        {
          children: ':root{--brand-primary:#2B8FD4;--brand-navy:#0C447C;--background:#F5FAFE;--foreground:#0C447C}body{color:#0C447C;background-color:#F5FAFE;background-image:radial-gradient(1200px 600px at 10% -10%,rgba(43,143,212,0.18),transparent 60%),radial-gradient(900px 500px at 110% 10%,rgba(133,183,235,0.25),transparent 60%),linear-gradient(180deg,#EBF5FF 0%,#F5FAFE 100%);background-attachment:fixed;font-family:"Google Sans",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;margin:0}'
        }
      ]
    }
  }
})
