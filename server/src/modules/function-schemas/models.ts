import { z } from 'zod'

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/

export const Models = {
  id: z.object({
    id: z.string().uuid()
  }),
  create: z.object({
    definition: z.string().min(1, 'Definition is required'),
    enabled: z.boolean().optional().default(true)
  }),
  update: z.object({
    definition: z.string().min(1).optional(),
    enabled: z.boolean().optional()
  })
}

export function parseDefinition(
  raw: string
): { name: string; description: string; parameters: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Definition must be valid JSON')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Definition must be a JSON object')
  }
  const obj = parsed as Record<string, unknown>

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    throw new Error('Definition must declare a "name" string')
  }
  if (obj.name.length > 64) {
    throw new Error('Name must be 64 characters or fewer')
  }
  if (!NAME_REGEX.test(obj.name)) {
    throw new Error(
      'Name may only contain letters, digits, underscores, and dashes'
    )
  }

  if (
    typeof obj.description !== 'string' ||
    obj.description.length === 0
  ) {
    throw new Error('Definition must declare a "description" string')
  }
  if (obj.description.length > 500) {
    throw new Error('Description must be 500 characters or fewer')
  }

  if (
    typeof obj.parameters !== 'object' ||
    obj.parameters === null ||
    Array.isArray(obj.parameters)
  ) {
    throw new Error('Definition must declare a "parameters" object')
  }
  const params = obj.parameters as Record<string, unknown>
  if (params.type !== 'object') {
    throw new Error('Parameters must declare "type": "object"')
  }
  if (
    typeof params.properties !== 'object' ||
    params.properties === null ||
    Array.isArray(params.properties)
  ) {
    throw new Error('Parameters must declare a "properties" object')
  }

  return {
    name: obj.name,
    description: obj.description,
    parameters: JSON.stringify(params)
  }
}

export type CreateFunctionSchemaInput = z.infer<typeof Models.create>
export type UpdateFunctionSchemaInput = z.infer<typeof Models.update>
