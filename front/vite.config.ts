import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type ProxyOptions } from 'vite';

const apiProxy: ProxyOptions = {
  target: 'http://localhost:8080',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
};

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    proxy: {
      '/api': apiProxy,
    },
  },
});
