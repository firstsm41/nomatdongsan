import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages: https://firstsm41.github.io/nomatdongsan/ */
const base =
  process.env.GITHUB_PAGES === 'true' ? '/nomatdongsan/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
