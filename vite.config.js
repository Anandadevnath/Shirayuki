import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://hi-anime-proxy-1.onrender.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    }
  }
})
