// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue()
  ],
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  base: '',
  server: {
    host: true,
    port: 8080, // 将开发服务器端口设置为8080，确保与其他服务兼容
  },
  resolve: {
    alias: {
      '@': '/src', // 设置路径别名
    },
  }
});