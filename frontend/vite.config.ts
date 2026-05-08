import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const plugins: import('vite').Plugin[] = [react()]

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3998',
        changeOrigin: true,
      },
    },
  },
})
