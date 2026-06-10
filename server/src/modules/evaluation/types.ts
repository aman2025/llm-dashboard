export interface EvaluationStreamRequest {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface EvaluationSSEEvent {
  content?: string
  request?: unknown
  response?: unknown
  metrics?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    promptEvalDuration?: number
    generationDuration?: number
    timeToFirstToken?: number
  }
  done?: boolean
  error?: string
}

export interface LLMMessage {
  role: string
  content: string
  tool_call_id?: string
  name?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
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
      tool_calls?: Array<{
        index?: number
        id?: string
        type?: 'function'
        function?: { name?: string; arguments?: string }
      }>
    }
    finish_reason?: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}
