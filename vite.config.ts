import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react({})],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/auth': 'http://127.0.0.1:3000',
      '/socket.io': 'http://127.0.0.1:3000',
    },
  },
  build: {
    outDir: resolve(__dirname, '../dist/public'),
    emptyOutDir: false,
  },
});
