import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Layouts from 'vite-plugin-vue-layouts'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import VueRouter from 'vue-router/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    VueRouter(),
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', VueRouterAutoImports, 'pinia'],
      dts: true,
      eslintrc: {
        enabled: true,
      },
    }),
    Layouts({
      layoutsDirs: './src/layouts',
      pagesDirs: './src/pages',
      defaultLayout: 'default',
    }),
    Components({
      dts: true,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
