import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages deploys to https://<user>.github.io/triviaquiz/
  // Change 'triviaquiz' if your repository has a different name
  base: '/triviaquiz/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TriviaQuiz Multiplayer',
        short_name: 'TriviaQuiz',
        theme_color: '#1e1b4b',
        background_color: '#0f0a1e',
        display: 'standalone',
        start_url: '/triviaquiz/',
        scope: '/triviaquiz/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      }
    })
  ]
})
