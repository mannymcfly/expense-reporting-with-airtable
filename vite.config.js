import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',  // auto-imports React into every JSX file
    }),
  ],
  base: '/',
})
