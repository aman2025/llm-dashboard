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
      activeLlmId: model1.id,
      systemPrompt:
        'You are a high-fidelity local LLM expert optimized to obey negative guidelines and structured tool signatures. Think step-by-step prior to writing the payload return.',
      maxTokens: 1000
    }
  })

  // Seed example function schemas
  await prisma.functionSchema.upsert({
    where: { name: 'get_weather_forecast' },
    update: {
      description:
        'Retrieve live multi-city weather conditions, wind metrics, and atmospheric humidity',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          locations: { type: 'array', items: { type: 'string' } }
        },
        required: ['locations']
      })
    },
    create: {
      name: 'get_weather_forecast',
      description:
        'Retrieve live multi-city weather conditions, wind metrics, and atmospheric humidity',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          locations: { type: 'array', items: { type: 'string' } }
        },
        required: ['locations']
      }),
      enabled: true
    }
  })

  await prisma.functionSchema.upsert({
    where: { name: 'calculator_solver' },
    update: {
      description:
        'Executes highly precise double-precision floating math equations and matrix coordinates',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          formula: { type: 'string' },
          steps_required: { type: 'boolean' }
        },
        required: ['formula']
      })
    },
    create: {
      name: 'calculator_solver',
      description:
        'Executes highly precise double-precision floating math equations and matrix coordinates',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          formula: { type: 'string' },
          steps_required: { type: 'boolean' }
        },
        required: ['formula']
      }),
      enabled: true
    }
  })

  console.log('Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
