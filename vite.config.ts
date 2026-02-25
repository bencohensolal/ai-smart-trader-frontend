import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: process.cwd(),
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
    outDir: 'dist',
    emptyOutDir: true,
  },
});
