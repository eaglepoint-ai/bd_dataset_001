// vitest.config.js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react-redux': resolve(__dirname, 'node_modules/react-redux'),
      '@reduxjs/toolkit': resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
      'react-hook-form': resolve(__dirname, 'node_modules/react-hook-form'),
    },
  },
  test: {
    globals: true,              // lets you use describe/it/expect without imports
    environment: 'jsdom',
    setupFiles: './tests/vitest.setup.js',
    css: false,                 // skip css processing in tests (faster)
    testTimeout: 10000,
  },
})