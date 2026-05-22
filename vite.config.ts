import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        adminLogin: 'admin-login.html',
        adminCallback: 'admin-callback.html'
      }
    }
  },
  preview: {
    port: 3000
  }
});