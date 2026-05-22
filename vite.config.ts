// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        'admin-login': 'admin-login.html',
        'admin-callback': 'admin-callback.html'
      }
    }
  }
});