// ESM, because client/package.json has "type":"module"
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 80
const apiTarget = process.env.API_PROXY_PASS || 'http://server:3000'

// Proxy /api -> backend
app.use(
  '/api',
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    // keep /api prefix as-is
  }),
)

// Serve built SPA
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Client listening on 0.0.0.0:${port}, proxy -> ${apiTarget}`)
})

console.log('API_PROXY_PASS =', apiTarget)

try {
  const host = new URL(apiTarget).hostname
  const ip = await dns.lookup(host)
  console.log('DNS lookup:', host, '->', ip.address)
} catch (e) {
  console.error('DNS lookup failed:', e)
}
