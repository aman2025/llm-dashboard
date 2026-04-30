import { z } from "zod";

export const settingsUpdateSchema = z.object({
  interfaceLanguage: z.string().min(2).max(10).optional(),
  llmNames: z.array(z.string().min(1)).optional(),
  defaultLlmName: z.string().optional(),
}).strict();

export const addLlmNameSchema = z.object({
  name: z.string().min(1).max(100),
});