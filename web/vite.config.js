import { defineConfig } from 'vite';

// base './' supaya hasil build bisa dibuka di subfolder GitHub Pages
// dan nanti dibungkus Capacitor tanpa diubah.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 900 }
});
