import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '超级管理员',
      role: 'admin'
    }
  })

  // Seed default LLM models
  const model1 = await prisma.llmModel.upsert({
    where: { name: 'Qwen3.5-4B-MLX-4bit' },
    update: {},
    create: {
      name: 'Qwen3.5-4B-MLX-4bit',
      size: '4B',
      type: 'LLM',
      description: 'Large language model optimized for instruction following',
      fileSize: '2.97 GB',
      quantization: 'Q4_K_M',
      contextWindow: '128K',
      isActive: true
    }
  })

  const model2 = await prisma.llmModel.upsert({
    where: { name: 'MLX-Qwen3.5-9B-Claude-4.6-Opus-6bit' },
    update: {},
    create: {
      name: 'MLX-Qwen3.5-9B-Claude-4.6-Opus-6bit',
      size: '9B',
      type: 'LLM',
      description: 'Efficient instruction-following model',
      fileSize: '7.12 GB',
      quantization: '6bit',
      contextWindow: '200K',
      isActive: false
    }
  })

  // Seed default settings (singleton)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activeLlmId: model1.id
    }
  })

  console.log('Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
