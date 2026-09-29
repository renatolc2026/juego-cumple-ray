import { defineConfig } from 'vite';

// base relativa para que funcione en GitHub Pages / Netlify / cualquier subcarpeta
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
