import { z } from 'zod'

const llmModelFields = {
  id: z.string(),
  name: z.string(),
  size: z.string(),
  type: z.string(),
  description: z.string(),
  fileSize: z.string(),
  quantization: z.string(),
  contextWindow: z.string(),
  isActive: z.boolean()
}

export const Models = {
  llmModel: z.object(llmModelFields),
  settings: z.object({
    activeLlmId: z.string().nullable(),
    activeLlm: z.object(llmModelFields).nullable(),
    systemPrompt: z.string().nullable(),
    maxTokens: z.number().int().min(1).max(8000).nullable()
  }),
  updateActiveLlm: z.object({
    llmId: z.string()
  }),
  updateEvaluationParams: z
    .object({
      systemPrompt: z.string().max(4000).optional(),
      maxTokens: z.number().int().min(1).max(8000).optional()
    })
    .refine(
      (data) =>
        data.systemPrompt !== undefined || data.maxTokens !== undefined,
      { message: 'At least one field must be provided' }
    )
}

export type LlmModel = z.infer<typeof Models.llmModel>
export type Settings = z.infer<typeof Models.settings>
export type UpdateActiveLlm = z.infer<typeof Models.updateActiveLlm>
export type UpdateEvaluationParams = z.infer<typeof Models.updateEvaluationParams>
