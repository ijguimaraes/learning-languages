import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/search': 'http://localhost:8000',
      '/parse': 'http://localhost:8000',
      '/movies': 'http://localhost:8000',
      '/cards': 'http://localhost:8000',
    },
  },
})
