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
