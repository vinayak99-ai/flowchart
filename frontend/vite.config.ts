import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Only used by the ported Spec Builder source (features/spec-builder/),
      // which came from a separate app that already used this convention.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
