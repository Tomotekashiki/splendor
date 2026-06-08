module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          50: '#e6faff',
          100: '#b3f5ff',
          200: '#80eaff',
          300: '#4ddfff',
          400: '#1ad5ff',
          500: '#00d9ff', // Core Electric Cyan
          600: '#00b4e0',
          700: '#008fb8',
          800: '#006a8f',
          900: '#004566',
          950: '#00223b',
        },
        primary: {
          DEFAULT: '#1a2744', // Deep Midnight Blue
          hover: '#131e33',
        },
        secondary: {
          DEFAULT: '#00d9ff', // Electric Cyan
          hover: '#00b8d9',
        },
        accent: {
          DEFAULT: '#2dd4bf', // Mint Green
          hover: '#14b8a6',
        },
        slate: {
          950: '#0b0f19',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
    },
  },
  plugins: [],
}
