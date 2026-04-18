import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// This tells Vite to handle both React and the Neon/Tailwind styles
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})