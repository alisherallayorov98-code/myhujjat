/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react           from '@vitejs/plugin-react'
import { resolve }     from 'path'

// Vitest config — Next.js + React komponentlar uchun
// `npm test` bilan ishga tushadi
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // tsconfig path mapping bilan mos
      '@': resolve(__dirname, './'),
    },
  },

  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./test/setup.ts'],
    include:     ['**/*.{test,spec}.{ts,tsx}'],
    exclude:     ['node_modules', '.next', 'out', 'dist'],

    // CSS modulelari ishlatish — components import qilganda CSS yuklanmaydi
    css: false,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include:  ['app/**', 'components/**', 'lib/**'],
      exclude:  ['**/*.d.ts', '**/*.config.*', '**/messages/**'],
    },
  },
})
