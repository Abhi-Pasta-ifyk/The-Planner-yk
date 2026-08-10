import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // <-- CRITICAL: Tells Vite to use relative paths for local files
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.js',
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'UPSC Planner Command Center',
        short_name: 'UPSC Planner',
        description: 'Offline-first execution tracking for UPSC prep.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})