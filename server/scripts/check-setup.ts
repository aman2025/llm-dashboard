#!/usr/bin/env bun
/* eslint-disable no-console */

/**
 * Setup Diagnostic Script
 * Checks if the server environment is properly configured
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
}

function pass(message: string) {
  console.log(`✅ ${message}`)
  checks.passed++
}

function fail(message: string) {
  console.log(`❌ ${message}`)
  checks.failed++
}

function warn(message: string) {
  console.log(`⚠️  ${message}`)
  checks.warnings++
}

function section(title: string) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(title)
  console.log('='.repeat(50))
}

async function main() {
  console.log('\n🔍 LLM Dashboard Server Setup Diagnostic\n')

  // Check 1: Environment Variables
  section('1. Environment Variables')
  
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    pass('DATABASE_URL is set')
    console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
  } else {
    fail('DATABASE_URL is not set')
  }

  const port = process.env.PORT
  if (port) {
    pass(`PORT is set: ${port}`)
  } else {
    warn('PORT is not set (will default to 3002)')
  }

  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv) {
    pass(`NODE_ENV is set: ${nodeEnv}`)
  } else {
    warn('NODE_ENV is not set (will default to development)')
  }

  // Check 2: Database Connection
  section('2. Database Connection')
  
  if (!databaseUrl) {
    fail('Cannot test database connection without DATABASE_URL')
  } else {
    try {
      const pool = new pg.Pool({ connectionString: databaseUrl })
      const client = await pool.connect()
      pass('PostgreSQL connection successful')
      
      const result = await client.query('SELECT version()')
      console.log(`   PostgreSQL version: ${result.rows[0].version.split(',')[0]}`)
      
      client.release()
      await pool.end()
    } catch (error) {
      fail(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check 3: Prisma Client
  section('3. Prisma Client')
  
  try {
    if (!databaseUrl) {
      fail('Cannot initialize Prisma without DATABASE_URL')
    } else {
      const pool = new pg.Pool({ connectionString: databaseUrl })
      const adapter = new PrismaPg(pool)
      const prisma = new PrismaClient({ adapter })
      
      pass('Prisma client initialized')
      
      // Check if tables exist
      try {
        const sessionCount = await prisma.chatSession.count()
        pass(`ChatSession table exists (${sessionCount} records)`)
        
        const messageCount = await prisma.chatMessage.count()
        pass(`ChatMessage table exists (${messageCount} records)`)
        
        const settingsCount = await prisma.settings.count()
        pass(`Settings table exists (${settingsCount} records)`)
      } catch (error) {
        fail(`Database tables not found: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log('\n   💡 Run migrations: bunx prisma migrate deploy')
      }
      
      await prisma.$disconnect()
      await pool.end()
    }
  } catch (error) {
    fail(`Prisma client error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.log('\n   💡 Try: bunx prisma generate')
  }

  // Check 4: File Structure
  section('4. File Structure')
  
  const requiredFiles = [
    'prisma/schema.prisma',
    'prisma.config.ts',
    'src/index.ts',
    'src/app.ts',
    'src/lib/prisma.ts',
    'src/modules/chat/index.ts',
    'src/modules/chat/service.ts',
    'src/modules/chat/controller.ts',
    'src/modules/chat/types.ts'
  ]

  for (const file of requiredFiles) {
    try {
      await Bun.file(file).text()
      pass(`${file} exists`)
    } catch {
      fail(`${file} is missing`)
    }
  }

  // Summary
  section('Summary')
  console.log(`✅ Passed: ${checks.passed}`)
  console.log(`❌ Failed: ${checks.failed}`)
  console.log(`⚠️  Warnings: ${checks.warnings}`)

  if (checks.failed === 0) {
    console.log('\n🎉 All critical checks passed! Server should be ready to run.')
    console.log('\n   Start server: bun run dev')
  } else {
    console.log('\n⚠️  Some checks failed. Please fix the issues above.')
    console.log('\n   See SETUP.md for detailed instructions.')
  }

  process.exit(checks.failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('\n💥 Diagnostic script failed:', error)
  process.exit(1)
})
