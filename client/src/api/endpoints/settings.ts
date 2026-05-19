import { apiClient } from '../axios'
import { unwrapResponse, type ApiResponse } from '../response'

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
  get: async (): Promise<Settings> => {
    const response = await apiClient.get<ApiResponse<Settings>>('/settings')
    return unwrapResponse(response)
  },

  update: async (data: SettingsUpdate): Promise<Settings> => {
    const response = await apiClient.patch<ApiResponse<Settings>>('/settings', data)
    return unwrapResponse(response)
  },

  addLlmName: async (name: string): Promise<Settings> => {
    const response = await apiClient.post<ApiResponse<Settings>>('/settings/llm-names', { name })
    return unwrapResponse(response)
  },

  removeLlmName: async (name: string): Promise<Settings> => {
    const encodedName = encodeURIComponent(name)
    const response = await apiClient.delete<ApiResponse<Settings>>(`/settings/llm-names/${encodedName}`)
    return unwrapResponse(response)
  }
}