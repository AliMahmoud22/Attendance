import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/react/',

    plugins: [react(), tailwindcss()],

    build: {
        outDir: '../wwwroot/react',
        emptyOutDir: true,
    },

    server: {
        proxy: {
            '/api': 'http://localhost:5105'
        }
    }
})