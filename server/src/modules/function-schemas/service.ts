import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import {
  parseDefinition,
  type CreateFunctionSchemaInput,
  type UpdateFunctionSchemaInput
} from './models'
import type { FunctionSchema } from './types'

function toResponse(row: {
  id: string
  name: string
  description: string
  parameters: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}): FunctionSchema {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    parameters: row.parameters,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export async function list({ enabledOnly = false }: { enabledOnly?: boolean } = {}) {
  const rows = await prisma.functionSchema.findMany({
    where: enabledOnly ? { enabled: true } : undefined,
    orderBy: { createdAt: 'asc' }
  })
  return rows.map(toResponse)
}

export async function getEnabled(): Promise<FunctionSchema[]> {
  return list({ enabledOnly: true })
}

export async function getById(id: string) {
  const row = await prisma.functionSchema.findUnique({ where: { id } })
  if (!row) {
    throw new AppError('NOT_FOUND', `Function schema "${id}" not found`, 404)
  }
  return toResponse(row)
}

export async function create(input: CreateFunctionSchemaInput) {
  let parsed: { name: string; description: string; parameters: string }
  try {
    parsed = parseDefinition(input.definition)
  } catch (err) {
    if (err instanceof Error) {
      throw new AppError('VALIDATION_ERROR', err.message, 400)
    }
    throw err
  }
  try {
    const row = await prisma.functionSchema.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        parameters: parsed.parameters,
        enabled: input.enabled ?? true
      }
    })
    return toResponse(row)
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new AppError(
        'CONFLICT',
        `A function schema named "${parsed.name}" already exists`,
        409
      )
    }
    throw err
  }
}

export async function update(id: string, input: UpdateFunctionSchemaInput) {
  const data: {
    name?: string
    description?: string
    parameters?: string
    enabled?: boolean
  } = {}
  if (input.definition !== undefined) {
    let parsed: { name: string; description: string; parameters: string }
    try {
      parsed = parseDefinition(input.definition)
    } catch (err) {
      if (err instanceof Error) {
        throw new AppError('VALIDATION_ERROR', err.message, 400)
      }
      throw err
    }
    data.name = parsed.name
    data.description = parsed.description
    data.parameters = parsed.parameters
  }
  if (input.enabled !== undefined) {
    data.enabled = input.enabled
  }
  try {
    const row = await prisma.functionSchema.update({ where: { id }, data })
    return toResponse(row)
  } catch (err) {
    if (err instanceof Error && 'code' in err) {
      const code = (err as { code: string }).code
      if (code === 'P2025') {
        throw new AppError('NOT_FOUND', `Function schema "${id}" not found`, 404)
      }
      if (code === 'P2002') {
        throw new AppError(
          'CONFLICT',
          `A function schema with that name already exists`,
          409
        )
      }
    }
    throw err
  }
}

export async function toggle(id: string) {
  const existing = await prisma.functionSchema.findUnique({ where: { id } })
  if (!existing) {
    throw new AppError('NOT_FOUND', `Function schema "${id}" not found`, 404)
  }
  const row = await prisma.functionSchema.update({
    where: { id },
    data: { enabled: !existing.enabled }
  })
  return toResponse(row)
}

export async function remove(id: string) {
  try {
    await prisma.functionSchema.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025') {
      throw new AppError('NOT_FOUND', `Function schema "${id}" not found`, 404)
    }
    throw err
  }
  return { success: true }
}

export const functionSchemasService = {
  list,
  getEnabled,
  getById,
  create,
  update,
  toggle,
  remove
} as const
