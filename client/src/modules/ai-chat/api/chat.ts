import { apiClient } from '@/api/axios'
import type { ChatMessage, SessionListItem } from './chat.types'

export const chatApi = {
  getSessions: async (): Promise<SessionListItem[]> => {
    return apiClient.get('/chat/sessions')
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    return apiClient.get(`/chat/sessions/${sessionId}/messages`)
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chat/sessions/${sessionId}`)
  },

  getStreamUrl: (): string => {
    const baseURL = (process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api').replace(/\/+$/, '')
    return `${baseURL}/chat/stream`
  }
}
