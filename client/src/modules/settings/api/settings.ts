import { apiClient } from '@/api/axios'
import type { LlmModel, Settings } from './settings.types'

export const settingsApi = {
  /** Get settings */
  get: () => apiClient.get<Settings>('/settings'),

  /** Get all LLM models */
  getAllLlmModels: () => apiClient.get<LlmModel[]>('/settings/llm-models'),

  /** Set active LLM model */
  setActiveLlm: (llmId: string) => apiClient.patch<Settings>('/settings/active-llm', { llmId })
}
