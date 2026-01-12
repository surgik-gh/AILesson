import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file or environment configuration.');
}

// Create connection pool
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({ connectionString: process.env.DATABASE_URL })
}

// Create Prisma Client with adapter
export const prisma = globalForPrisma.prisma ?? (
  globalForPrisma.pool 
    ? new PrismaClient({ adapter: new PrismaPg(globalForPrisma.pool) })
    : new PrismaClient()
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
