/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        khata: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          green: {
            light: '#dcfce7',
            DEFAULT: '#10b981',
            dark: '#059669',
            badge: '#064e3b'
          },
          red: {
            light: '#ffe4e6',
            DEFAULT: '#f43f5e',
            dark: '#e11d48',
            badge: '#881337'
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'keypad': '0 4px 0 0 rgba(0,0,0,0.15)',
        'keypad-active': '0 1px 0 0 rgba(0,0,0,0.15)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px -3px rgba(244, 63, 94, 0.4)',
      }
    },
  },
  plugins: [],
}
