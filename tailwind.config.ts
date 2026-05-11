import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          DEFAULT: '#6b1f2a',
          mid: '#b8394e',
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
        rust: '#b8401f',
        olive: '#6b6a3d',
        honey: {
          400: '#f5b731',
          500: '#e8a025',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,29,26,0.025)',
        icon: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px rgba(31,29,26,0.10)',
        sheet: '0 -10px 40px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
