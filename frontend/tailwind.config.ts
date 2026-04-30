import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',
        info:    '#0891B2',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'modal':  '0 20px 60px rgba(0,0,0,0.15)',
        'button': '0 1px 2px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
    },
  },
  plugins: [],
}

export default config
