import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5173

// Serve static files from dist folder with caching
app.use(
  express.static(path.join(__dirname, '../dist'), {
    maxAge: '1d',
    etag: false,
  }),
)

// SPA routing: serve index.html for all non-file requests (middleware approach)
app.use((req, res, next) => {
  // Skip static file requests
  if (path.extname(req.path)) {
    return next()
  }
  // Serve index.html for all route requests
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found')
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`)
})
