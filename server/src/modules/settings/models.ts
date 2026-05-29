import { z } from 'zod'

export const Models = {
  llmModel: z.object({
    id: z.string(),
    name: z.string(),
    size: z.string(),
    type: z.string(),
    description: z.string(),
    fileSize: z.string(),
    quantization: z.string(),
    contextWindow: z.string(),
    isActive: z.boolean()
  }),
  settings: z.object({
    activeLlmId: z.string().nullable(),
    activeLlm: z
      .object({
        id: z.string(),
        name: z.string(),
        size: z.string(),
        type: z.string(),
        description: z.string(),
        fileSize: z.string(),
        quantization: z.string(),
        contextWindow: z.string(),
        isActive: z.boolean()
      })
      .nullable()
  }),
  updateActiveLlm: z.object({
    llmId: z.string()
  })
}

export type LlmModel = z.infer<typeof Models.llmModel>
export type Settings = z.infer<typeof Models.settings>
export type UpdateActiveLlm = z.infer<typeof Models.updateActiveLlm>
