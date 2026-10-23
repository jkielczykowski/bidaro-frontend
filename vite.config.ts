import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev only: point /api/search at a bidigo-search instance and /api/v1 at bidigo-api (nginx does
// this in production), e.g. SEARCH_API_URL=http://127.0.0.1:9095, BIDIGO_API_URL=http://127.0.0.1:8089
// for the E2E stack.
const searchApi = process.env.SEARCH_API_URL
const bidigoApi = process.env.BIDIGO_API_URL

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      ...(searchApi && {
        '/api/search': {
          target: searchApi,
          rewrite: (path: string) => path.replace(/^\/api\/search/, ''),
        },
      }),
      ...(bidigoApi && { '/api/v1': { target: bidigoApi } }),
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})
