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
  id?: string
  model?: string
  created?: number
  choices?: Array<{
    delta?: {
      role?: string
      content?: string
      reasoning_content?: string
    }
    finish_reason?: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface LLMResponseSummary {
  id?: string
  model?: string
  created?: number
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      reasoning_content?: string
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}
