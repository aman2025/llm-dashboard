import { z } from 'zod'

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/

export const Models = {
  id: z.object({
    id: z.string().uuid()
  }),
  create: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(64, 'Name must be 64 characters or fewer')
      .regex(NAME_REGEX, 'Name may only contain letters, digits, underscores, and dashes'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(500, 'Description must be 500 characters or fewer'),
    parameters: z.string().min(1, 'Parameters JSON is required'),
    enabled: z.boolean().optional().default(true)
  }),
  update: z.object({
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(NAME_REGEX)
      .optional(),
    description: z.string().min(1).max(500).optional(),
    parameters: z.string().min(1).optional(),
    enabled: z.boolean().optional()
  })
}

export function validateJsonSchemaShape(raw: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Parameters must be valid JSON')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Parameters must be a JSON object')
  }
  const obj = parsed as Record<string, unknown>
  if (obj.type !== 'object') {
    throw new Error('Parameters must declare "type": "object"')
  }
  if (
    typeof obj.properties !== 'object' ||
    obj.properties === null ||
    Array.isArray(obj.properties)
  ) {
    throw new Error('Parameters must declare a "properties" object')
  }
  return obj
}

export type CreateFunctionSchemaInput = z.infer<typeof Models.create>
export type UpdateFunctionSchemaInput = z.infer<typeof Models.update>
