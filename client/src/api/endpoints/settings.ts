import { apiClient } from '../axios'

export interface LlmModel {
  id: string
  name: string
  size: string
  type: string
  description: string
  fileSize: string
  quantization: string
  contextWindow: string
  isActive: boolean
}

export interface Settings {
  activeLlmId: string | null
  activeLlm: LlmModel | null
}

export const settingsApi = {
  /** Get settings */
  get: () => apiClient.get<Settings>('/settings'),

  /** Get all LLM models */
  getAllLlmModels: () => apiClient.get<LlmModel[]>('/settings/llm-models'),

  /** Set active LLM model */
  setActiveLlm: (llmId: string) =>
    apiClient.patch<Settings>('/settings/active-llm', { llmId })
}
