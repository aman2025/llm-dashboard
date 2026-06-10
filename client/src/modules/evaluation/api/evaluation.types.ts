export interface EvaluationHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface EvaluationStreamRequest {
  message: string
  history: EvaluationHistoryMessage[]
}

export interface EvaluationSSEEvent {
  content?: string
  request?: unknown
  response?: unknown
  metrics?: {
    inputTokens?: number
    outputTokens?: number
    timeToFirstToken?: number
    promptTokensPerSecond?: number
    generationTokensPerSecond?: number
  }
  done?: boolean
  error?: string
}

export interface EvaluationResponsePayload {
  id?: string
  object?: string
  model?: string
  created?: number
  choices?: Array<{
    index: number
    message: {
      role: string
      content: string
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface EvaluationMetrics {
  inputTokens: number
  outputTokens: number
  timeToFirstToken: number
  promptTokensPerSecond: number
  generationTokensPerSecond: number
}
