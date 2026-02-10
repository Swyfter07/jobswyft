import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "../packages/ui/src"),
            "~": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                sidepanel: path.resolve(__dirname, 'index.html'),
                background: path.resolve(__dirname, 'src/background/index.ts'),
                content: path.resolve(__dirname, 'src/content/index.ts'),
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]'
            }
        }
    }
})
