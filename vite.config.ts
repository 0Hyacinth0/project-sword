import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // 开发环境代理 —— 将 /jeecg-boot 请求转发到后端
    proxy: {
      '/jeecg-boot': {
        target: 'http://192.168.0.228:8080',
        changeOrigin: true
      }
    }
  }
})
