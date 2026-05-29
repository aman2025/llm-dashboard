import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { Settings, LlmModel } from './models'

export async function getSettings(): Promise<Settings> {
  let settings = await prisma.settings.findUnique({
    where: { id: 1 },
    include: {
      activeLlm: true
    }
  })

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1 },
      include: {
        activeLlm: true
      }
    })
  }

  return {
    activeLlmId: settings.activeLlmId,
    activeLlm: settings.activeLlm
  }
}

export async function getAllLlmModels(): Promise<LlmModel[]> {
  const models = await prisma.llmModel.findMany({
    orderBy: { createdAt: 'asc' }
  })

  return models.map((model) => ({
    id: model.id,
    name: model.name,
    size: model.size,
    type: model.type,
    description: model.description,
    fileSize: model.fileSize,
    quantization: model.quantization,
    contextWindow: model.contextWindow,
    isActive: model.isActive
  }))
}

export async function setActiveLlm(llmId: string): Promise<Settings> {
  // Verify the LLM exists
  const llm = await prisma.llmModel.findUnique({
    where: { id: llmId }
  })

  if (!llm) {
    throw new AppError('NOT_FOUND', `LLM model with id "${llmId}" not found`)
  }

  // Update all models to inactive
  await prisma.llmModel.updateMany({
    data: { isActive: false }
  })

  // Set the selected model as active
  await prisma.llmModel.update({
    where: { id: llmId },
    data: { isActive: true }
  })

  // Update settings
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: { activeLlmId: llmId },
    include: {
      activeLlm: true
    }
  })

  return {
    activeLlmId: settings.activeLlmId,
    activeLlm: settings.activeLlm
  }
}

export const settingsService = {
  getSettings,
  getAllLlmModels,
  setActiveLlm
} as const
