import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // The API has no CORS policy configured, and shouldn't need one for local
      // dev: the browser only ever talks to this dev server's own origin, which
      // forwards /api/* to the real API. A production deployment would put both
      // behind the same reverse-proxy origin the same way.
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
