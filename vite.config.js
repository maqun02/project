import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: "0.0.0.0",
    port: "3000",
    proxy: {
      '/api': {
        target: 'http://fwf.ns-6k0uv9r0.svc.cluster.local:8000',
        changeOrigin: true,
        secure: false,
        timeout: 10000, // 设置代理超时时间
        configure: (proxy, options) => {
          // 连接超时处理
          proxy.on('timeout', (req, res) => {
            console.error('代理请求超时:', req.url);
            res.writeHead(504, 'Proxy Timeout');
            res.end('代理请求超时，请稍后重试');
          });
          
          // 错误处理
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err);
            if (!res.headersSent) {
              res.writeHead(500, 'Proxy Error');
              res.end('代理服务器错误，请稍后重试');
            }
          });
          
          // 调试日志（已注释）
          proxy.on('proxyReq', (proxyReq, req, res) => {
            //console.log('发送代理请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            //console.log('收到代理响应:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
