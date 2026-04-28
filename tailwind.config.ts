import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clay: {
          50: '#fcf0eb',
          100: '#f8ddd3',
          200: '#f0bba9',
          300: '#e59278',
          400: '#d96e4c',
          500: '#c4552a',
          600: '#a8401a',
          700: '#882f0e',
          800: '#661f06',
          900: '#471204',
        },
        stone: {
          50: '#f7f3ee',
          100: '#ede6dc',
          200: '#e0d4c7',
          300: '#c9b8a8',
          400: '#b09880',
          500: '#8c7060',
          600: '#6e5644',
          700: '#4a3525',
          800: '#301f12',
          900: '#1a0e06',
        },
        honey: {
          400: '#f5b731',
          500: '#e8a025',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
