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
        sans: ["Google Sans", "sans-serif"],
        serif: ["Google Sans", "sans-serif"],
      },
      colors: {
        brand: {
          50: '#F5FAFE', // White Blue
          100: '#EBF5FF', // Sky Tint
          200: '#B5D4F4',
          300: '#85B7EB', // Light Blue
          400: '#378ADD',
          500: '#2B8FD4', // Primary Blue
          600: '#1A6FAB', // Deep Blue
          700: '#0C447C', // Navy
          800: '#08325C',
          900: '#05203D',
          950: '#021020',
        },
        primary: {
          DEFAULT: '#0C447C', // Navy
          hover: '#1A6FAB',
        },
        secondary: {
          DEFAULT: '#2B8FD4', // Primary Blue
          hover: '#1A6FAB',
        },
        accent: {
          DEFAULT: '#85B7EB', // Light Blue
          hover: '#378ADD',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(12, 68, 124, 0.08)',
        'glass-light': '0 8px 32px 0 rgba(43, 143, 212, 0.05)',
      },
    },
  },
  plugins: [],
}
