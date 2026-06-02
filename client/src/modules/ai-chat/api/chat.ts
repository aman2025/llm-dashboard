import { apiClient } from '@/api/axios'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  createdAt: string
}

export interface SessionListItem {
  id: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

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
    const baseURL = (
      process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api'
    ).replace(/\/+$/, '')
    return `${baseURL}/chat/stream`
  }
}
