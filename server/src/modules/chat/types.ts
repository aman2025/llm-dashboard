export interface ChatStreamRequest {
  sessionId?: string
  message: string
}

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

export interface SSEEvent {
  content?: string
  reasoning?: string
  done?: boolean
  error?: string
  sessionId?: string
}

export interface LLMMessage {
  role: string
  content: string
}

export interface LLMStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}
