import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port if 5173 is in use
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
