/**
 * Let Node read the engine's `?raw` asset imports.
 *
 * The design engine was written for the browser, where Vite turns `import ic1 from './x.svg?raw'`
 * into the file's text. The API process runs the same modules under `tsx`, which knows nothing
 * about that query, so pulling the engine in for server-side export made the server refuse to
 * start: `ERR_UNKNOWN_FILE_EXTENSION ".svg"`.
 *
 * It did not show up in the server tests, because those run through Vitest — which *is* Vite, and
 * resolves the import happily. Only starting the real process finds it. That is worth remembering:
 * a green server suite does not prove the server boots.
 *
 * Four files use it today (`marks/assets/perfume/*.svg`). Registering the hook is cheaper than
 * rewriting them, and it keeps one engine rather than a browser copy and a server copy.
 *
 * Imported for side effects, and imported first — hooks must be in place before anything that
 * reaches the engine is loaded.
 */
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAW = '?raw'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.endsWith(RAW)) return nextResolve(specifier, context)
    const clean = specifier.slice(0, -RAW.length)
    const base = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd()
    const absolute = clean.startsWith('.') ? path.resolve(base, clean) : clean
    return { url: `${pathToFileURL(absolute).href}${RAW}`, format: 'module', shortCircuit: true }
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(RAW)) return nextLoad(url, context)
    const file = fileURLToPath(url.slice(0, -RAW.length))
    return {
      format: 'module',
      source: `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`,
      shortCircuit: true,
    }
  },
})
