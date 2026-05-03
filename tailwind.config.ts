import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          DEFAULT: '#6b1f2a',
          dark: '#4d1620',
          soft: '#f3dee0',
          tint: '#fbeef0',
        },
        paper: {
          DEFAULT: '#f8f4ed',
          2: '#f1ebde',
          3: '#e9e1d0',
        },
        ink: {
          DEFAULT: '#1f1d1a',
          2: '#3d3a2f',
        },
        stone: {
          DEFAULT: '#9a9082',
          2: '#c0b6a3',
        },
        cream: '#fffaf0',
        honey: {
          400: '#f5b731',
          500: '#e8a025',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', '-apple-system', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
