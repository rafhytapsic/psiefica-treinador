/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c5cfc',
          600: '#7A5CFF',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        ink: {
          50: '#f8f7fc',
          100: '#efeef5',
          200: '#e0deec',
          300: '#c8c4dd',
          400: '#ada6c8',
          500: '#958bae',
          600: '#7d6f96',
          700: '#67597d',
          800: '#554a66',
          900: '#0e0b14',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
