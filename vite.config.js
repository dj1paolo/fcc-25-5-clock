import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/fcc-25-5-clock/',
  build: { outDir: 'docs' }
});
