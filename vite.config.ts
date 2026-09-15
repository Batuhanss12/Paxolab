import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

function spaClientShims(command: string): boolean {
  const argv = process.argv.join(' ')
  if (process.env.VITEST) return false
  if (/\bvitest\b/.test(argv) || /\bvite-node\b/.test(argv)) return false
  return command === 'serve' || command === 'build'
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: spaClientShims(command)
    ? {
        alias: {
          'node:fs': path.join(root, 'src/shims/node-fs.ts'),
          'node:path': path.join(root, 'src/shims/node-path.ts'),
          'node:url': path.join(root, 'src/shims/node-url.ts'),
        },
      }
    : {},
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'server/**'],
  },
}))
