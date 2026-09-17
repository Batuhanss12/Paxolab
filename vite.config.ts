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
    /*
     * Headroom, because these tests are genuinely slow rather than accidentally slow.
     *
     * Measured on an idle machine: the heaviest test runs 7.4 s, and three more sit between 2.8 and
     * 4.9 s — they read and atomize the SVG asset library, then generate whole catalog faces. The
     * default budget left no margin at all, so the suite was fine idle and fell apart under any
     * concurrent load: with three runs in parallel, 15 to 17 tests failed, every one of them with
     * `Test timed out` and not a single assertion among them.
     *
     * A suite that fails when the machine is busy teaches you to ignore red, which is worse than
     * having no suite. 30 s is generous against a 7.4 s worst case and still catches a real hang —
     * nothing here should ever take half a minute.
     */
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
}))
