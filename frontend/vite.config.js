import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const SEMANA = 7 * 24 * 60 * 60;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Cuando hay versión nueva, la app pregunta antes de recargar
      // (así no se reinicia a la mitad de un entrenamiento)
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FitMetrics',
        short_name: 'FitMetrics',
        description: 'Registra tus entrenamientos, tu progreso y tus suplementos.',
        lang: 'es-MX',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A0A0A',
        theme_color: '#0A0A0A',
        icons: [
          { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Todo lo de la app se guarda en el teléfono: pantallas, estilos, íconos
        // y las fotos de los ejercicios (≈2 MB). Así abre sin internet.
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
        // Las pantallas de arranque solo las usa iOS al agregar la app; no hace falta guardarlas
        globIgnores: ['arranque/**'],
        // Cualquier pantalla abre el index.html guardado (menos la API)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Datos de la API: primero internet; si no hay, lo último guardado.
            // Los reportes (PDF/CSV) no se guardan: se generan siempre al momento.
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/') &&
              request.method === 'GET' &&
              !url.pathname.startsWith('/api/reportes'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 150, maxAgeSeconds: SEMANA },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fuentes-css' }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fuentes',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Fotos aleatorias de las rutinas
            urlPattern: ({ url }) => url.origin === 'https://images.unsplash.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fotos-rutinas',
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
