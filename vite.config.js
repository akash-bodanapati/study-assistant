import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /**
     * Dev-server proxy: forward /api/* requests to a local Express server
     * running on port 3001 so we can test the serverless function locally
     * without deploying to Vercel. The Express server lives in server/index.js.
     * In production (Vercel), the /api/* routes go directly to the serverless fn.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
