import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev only: point /api/search at a bidigo-search instance (nginx does this in production),
// e.g. SEARCH_API_URL=http://127.0.0.1:9095 for the E2E stack.
const searchApi = process.env.SEARCH_API_URL

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: searchApi
      ? {
          '/api/search': {
            target: searchApi,
            rewrite: (path) => path.replace(/^\/api\/search/, ''),
          },
        }
      : undefined,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})
