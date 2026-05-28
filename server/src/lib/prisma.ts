import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: databaseUrl })

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Create Prisma client with adapter (Prisma 7 approach)
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})
