import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Builds straight into the Laravel app's public/app/ folder so the same
// origin serves both the SPA and the API — no CORS setup needed. See
// routes/web.php's catch-all route, which serves public/app/index.html.
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
