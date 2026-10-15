import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 官方自动 SSL 插件：任何人下载代码后，npm run dev 时自动为当前设备生成内存自签名证书
    // 无需手动生成/上传任何证书文件，Windows / Mac / Linux 全平台开箱即用支持手机 HTTPS 扫码
    basicSsl()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0', // 允许局域网设备(如手机相机)在同一WiFi下直接访问
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts-vendor': ['echarts'],
          'element-plus-vendor': ['element-plus', '@element-plus/icons-vue'],
          'scanner-vendor': ['html5-qrcode']
        }
      }
    }
  }
})
