/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — Yale Blue
        primary: {
          50: '#eef3f7',
          100: '#d4e2eb',
          200: '#a8c5d8',
          300: '#7ba4c0',
          400: '#4e80a3',
          500: '#0f3b59', // Yale Blue
          600: '#0d344f',
          700: '#0a2a40',
          800: '#072031',
          900: '#041521',
        },
        // Accent — Goldenrod
        accent: {
          50: '#fdf8ed',
          100: '#faeecf',
          200: '#f3dda0',
          300: '#ebc86c',
          400: '#e4b346',
          500: '#dba12c', // Goldenrod
          600: '#c48e1e',
          700: '#a47417',
          800: '#835b12',
          900: '#66460e',
        },
        // Supporting — Cool Steel
        steel: {
          50: '#f2f5f7',
          100: '#e3e9ed',
          200: '#c7d2d9',
          300: '#aabac4',
          400: '#93a6b3',
          500: '#7d929e', // Cool Steel
          600: '#667986',
          700: '#51616c',
          800: '#3d4a53',
          900: '#293238',
        },
        // Supporting — Dust Grey
        dust: {
          50: '#faf9f7',
          100: '#f2f0ed',
          200: '#e7e3de',
          300: '#dbd4cc', // Dust Grey
          400: '#c5bcb2',
          500: '#aea498',
          600: '#958a7d',
          700: '#7a6f63',
          800: '#5e554b',
          900: '#423b34',
        },
        // Neutral scales kept for existing pages
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'lift': '0 12px 24px -6px rgb(15 59 89 / 0.16)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'slide-up': 'slide-up 400ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
