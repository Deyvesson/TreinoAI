import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // O treino funciona offline: o app, a fonte e as imagens já vistas ficam no aparelho.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TreinoAI',
        short_name: 'TreinoAI',
        description: 'Seu plano de treino montado por IA, com registro de cada série.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f5f7',
        theme_color: '#f4f5f7',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        globIgnores: ['exercicios/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/exercicios/'),
            handler: 'CacheFirst',
            options: { cacheName: 'exercicios', expiration: { maxEntries: 400 } },
          },
        ],
      },
    }),
  ],
  // O app importa tipos e o catálogo de ../shared, fora da raiz do Vite.
  server: { fs: { allow: ['..'] } },
})
