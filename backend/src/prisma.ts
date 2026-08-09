import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

let prisma: PrismaClient
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
} catch (err) {
  // If Prisma/PG initialization fails (e.g., missing DATABASE_URL),
  // create a fallback PrismaClient without the adapter so code can still import the module.
  // Operations will fail at runtime if DB is not configured.
  // eslint-disable-next-line no-console
  console.warn('Prisma initialization warning:', (err as Error).message)
  prisma = new PrismaClient()
}

export default prisma
