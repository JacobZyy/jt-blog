import type { Connect, Plugin } from 'vite-plus'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import solid from '@solidjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, lazyPlugins } from 'vite-plus'

const contentRoot = resolve(fileURLToPath(new URL('../../packages/content/data/', import.meta.url)))

function contentType(filePath: string) {
  switch (extname(filePath).toLowerCase()) {
    case '.json': return 'application/json; charset=utf-8'
    case '.avif': return 'image/avif'
    case '.gif': return 'image/gif'
    case '.ico': return 'image/x-icon'
    case '.jpeg':
    case '.jpg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.svg': return 'image/svg+xml'
    case '.webp': return 'image/webp'
    default: return 'application/octet-stream'
  }
}

function contentFilesPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const rawPath = (req.url ?? '/').split('?', 1)[0]
    if (!rawPath.startsWith('/content/')) {
      next()
      return
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405
      res.end()
      return
    }

    let relativePath: string
    try {
      relativePath = decodeURIComponent(rawPath.slice('/content/'.length))
    }
    catch {
      res.statusCode = 400
      res.end('Invalid content path.')
      return
    }

    const filePath = resolve(contentRoot, relativePath)
    const relativeFilePath = relative(contentRoot, filePath)
    if (!relativeFilePath || relativeFilePath.startsWith('..') || isAbsolute(relativeFilePath) || relativeFilePath.includes('\0')) {
      res.statusCode = 403
      res.end('Forbidden content path.')
      return
    }

    try {
      const realContentRoot = realpathSync(contentRoot)
      const realFilePath = realpathSync(filePath)
      const realRelativeFilePath = relative(realContentRoot, realFilePath)
      if (!realRelativeFilePath || realRelativeFilePath.startsWith('..') || isAbsolute(realRelativeFilePath)) {
        res.statusCode = 403
        res.end('Forbidden content path.')
        return
      }

      if (!statSync(realFilePath).isFile()) {
        res.statusCode = 404
        res.end('Content not found.')
        return
      }

      const body = readFileSync(realFilePath)
      res.statusCode = 200
      res.setHeader('Content-Type', contentType(realFilePath))
      res.setHeader('Content-Length', body.byteLength)
      res.setHeader('Cache-Control', 'no-cache')
      res.end(req.method === 'HEAD' ? undefined : body)
    }
    catch {
      res.statusCode = 404
      res.end('Content not found.')
    }
  }

  return {
    name: 'jt-blog-content-files',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: lazyPlugins(() => [contentFilesPlugin(), tailwindcss(), solid()]),
})
