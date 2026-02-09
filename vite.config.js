import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/valentine-proposal/',
  build: {
    rollupOptions: {
      // This tells Vite: "Don't bundle these, they are already in index.html"
      external: ['@mediapipe/hands', '@mediapipe/camera_utils'],
      output: {
        globals: {
          '@mediapipe/hands': 'Hands',
          '@mediapipe/camera_utils': 'Camera'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@mediapipe/hands', '@mediapipe/camera_utils']
  }
})