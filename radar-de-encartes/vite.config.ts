import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' deixa o app funcionar em qualquer endereço (Vercel, prévia, subpasta).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
