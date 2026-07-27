import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: env.DEV_API_URL
      ? {
          proxy: {
            '/todos': {
              target: env.DEV_API_URL,
              changeOrigin: true,
            },
            '/order': {
              target: env.DEV_API_URL,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})
