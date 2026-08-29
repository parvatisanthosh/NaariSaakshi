/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-black': {
          DEFAULT: 'rgb(var(--bg-black-rgb) / <alpha-value>)',
        },
        magenta: {
          DEFAULT: '#E8368F',
          deep: '#B81F6B',
        },
        violet: {
          DEFAULT: '#7C5CFF',
        },
        cream: {
          DEFAULT: '#F5E7DE',
          ink: '#1A1410',
        },
        text: {
          light: 'rgb(var(--text-light-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        // Category tag specific colors
        catVerbal: '#a8a2a8',
        catPhysical: '#f5a585',
        catDigital: '#7fd4d9',
        catStalking: '#b3a1ff',
        catQuidProQuo: '#e8b464',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}