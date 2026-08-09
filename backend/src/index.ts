import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import customerRoutes from './routes/customers'
import productRoutes from './routes/products'
import challanRoutes from './routes/challans'
import userRoutes from './routes/users'
import settingsRoutes from './routes/settings'
import supplierRoutes from './routes/suppliers'
import poRoutes from './routes/purchaseOrders'

const app = express()
const PORT = process.env.PORT || 3000

// CORS configuration - allow frontend URL
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/challans', challanRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchase-orders', poRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`)
  })
}

export default app
