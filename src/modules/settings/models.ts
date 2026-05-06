import { z } from "zod";

export const Models = {
  settings: z.object({
    interfaceLanguage: z.string().min(2).max(10),
    llmNames: z.array(z.string().min(1)),
    defaultLlmName: z.string(),
  }),
  update: z.object({
    interfaceLanguage: z.string().min(2).max(10).optional(),
    llmNames: z.array(z.string().min(1)).optional(),
    defaultLlmName: z.string().optional(),
  }).strict(),
  addLlmName: z.object({
    name: z.string().min(1).max(100),
  }),
};

export type Settings = z.infer<typeof Models.settings>;
export type SettingsUpdate = z.infer<typeof Models.update>;
export type AddLlmName = z.infer<typeof Models.addLlmName>;