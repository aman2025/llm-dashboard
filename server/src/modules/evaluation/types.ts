export interface EvaluationStreamRequest {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
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
    input_tokens?: number
    output_tokens?: number
    model_load_duration?: number
    time_to_first_token?: number
    total_time?: number
    prompt_eval_duration?: number
    generation_duration?: number
    prompt_tokens_per_second?: number
    generation_tokens_per_second?: number
  }
}
