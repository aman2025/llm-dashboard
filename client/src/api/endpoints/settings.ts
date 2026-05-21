import { apiClient } from '../axios'

export interface Settings {
  interfaceLanguage: string
  llmNames: string[]
  defaultLlmName: string
}

export interface SettingsUpdate {
  interfaceLanguage?: string
  llmNames?: string[]
  defaultLlmName?: string
}

export const settingsApi = {
  /** Get settings */
  get: () => apiClient.get<Settings>('/settings'),

  /** Update settings */
  update: (data: SettingsUpdate) =>
    apiClient.patch<Settings>('/settings', data),

  /** Add an LLM name */
  addLlmName: (name: string) =>
    apiClient.post<Settings>('/settings/llm-names', { name }),

  /** Remove an LLM name */
  removeLlmName: (name: string) =>
    apiClient.delete<Settings>(
      `/settings/llm-names/${encodeURIComponent(name)}`
    )
}
