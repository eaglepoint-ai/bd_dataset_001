import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            'vitest': fileURLToPath(new URL('./node_modules/vitest', import.meta.url)),
            '@vue/test-utils': fileURLToPath(new URL('./node_modules/@vue/test-utils', import.meta.url)),
        }
    },
    server: {
        fs: {
            strict: false
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['**/*.spec.ts', '../tests/**/*.spec.ts']
    }
})
