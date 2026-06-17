import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type {
  LlmModel,
  Settings,
  UpdateEvaluationParams
} from './models'

function toSettings(row: {
  id: number
  activeLlmId: string | null
  systemPrompt: string | null
  maxTokens: number | null
  activeLlm: {
    id: string
    name: string
    size: string
    type: string
    description: string
    fileSize: string
    quantization: string
    contextWindow: string
    isActive: boolean
  } | null
}): Settings {
  return {
    activeLlmId: row.activeLlmId,
    activeLlm: row.activeLlm,
    systemPrompt: row.systemPrompt,
    maxTokens: row.maxTokens
  }
}

export async function getSettings(): Promise<Settings> {
  let row = await prisma.settings.findUnique({
    where: { id: 1 },
    include: { activeLlm: true }
  })

  if (!row) {
    row = await prisma.settings.create({
      data: { id: 1 },
      include: { activeLlm: true }
    })
  }

  return toSettings(row)
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
  const llm = await prisma.llmModel.findUnique({ where: { id: llmId } })

  if (!llm) {
    throw new AppError('NOT_FOUND', `LLM model with id "${llmId}" not found`)
  }

  await prisma.llmModel.updateMany({ data: { isActive: false } })

  await prisma.llmModel.update({
    where: { id: llmId },
    data: { isActive: true }
  })

  const row = await prisma.settings.update({
    where: { id: 1 },
    data: { activeLlmId: llmId },
    include: { activeLlm: true }
  })

  return toSettings(row)
}

export async function updateEvaluationParams(
  input: UpdateEvaluationParams
): Promise<Settings> {
  const data: { systemPrompt?: string; maxTokens?: number } = {}
  if (input.systemPrompt !== undefined) data.systemPrompt = input.systemPrompt
  if (input.maxTokens !== undefined) data.maxTokens = input.maxTokens

  const row = await prisma.settings.update({
    where: { id: 1 },
    data,
    include: { activeLlm: true }
  })

  return toSettings(row)
}

export const settingsService = {
  getSettings,
  getAllLlmModels,
  setActiveLlm,
  updateEvaluationParams
} as const
