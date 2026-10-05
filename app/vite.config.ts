import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // O app importa tipos e o catálogo de ../shared, fora da raiz do Vite.
  server: { fs: { allow: ['..'] } },
})
