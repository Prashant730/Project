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

// SPA routing: serve index.html for all non-file requests
app.get('*', (req, res) => {
  // Check if the request is for a file (has extension)
  if (path.extname(req.path)) {
    res.status(404).send('Not Found')
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`)
})
