import { settingsService } from '@/modules/settings/service'
import type {
  EvaluationStreamRequest,
  EvaluationSSEEvent,
  LLMMessage,
  LLMStreamChunk
} from './types'

const API_URL = 'http://192.168.2.8:8000/v1/chat/completions'
const API_KEY = 'zr425899'

const SYSTEM_PROMPT =
  'You are a high-fidelity local LLM expert optimized to obey negative guidelines and structured tool signatures. Think step-by-step prior to writing the payload return.'

const GET_WEATHER_TOOL = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Retrieve live weather conditions for a single target location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  }
}

export const evaluationService = {
  async stream(
    req: EvaluationStreamRequest,
    onEvent: (event: EvaluationSSEEvent) => void,
    abortSignal?: AbortSignal
  ) {
    const llmAbortController = new AbortController()

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        console.log('Client disconnected, aborting evaluation LLM request')
        llmAbortController.abort()
      })
    }

    const startTime = performance.now()
    let firstTokenTime: number | null = null

    try {
      const settings = await settingsService.getSettings()
      const activeModel = settings.activeLlm?.name

      if (!activeModel) {
        throw new Error(
          'No active LLM model configured. Please select a model in settings.'
        )
      }

      const llmMessages: LLMMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...req.history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: req.message }
      ]

      const requestPayload = {
        model: activeModel,
        messages: llmMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 350,
        stream: true,
        stream_options: { include_usage: true },
        tools: [GET_WEATHER_TOOL]
      }

      console.log('\n=== EVAL LLM REQUEST ===')
      console.log(JSON.stringify(requestPayload, null, 2))
      console.log('=======================\n')

      onEvent({ request: requestPayload })

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestPayload),
        signal: llmAbortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `LLM API error: ${response.status} ${response.statusText} - ${errorText}`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      const toolCalls: Array<{ id: string; name: string; arguments: string }> = []
      let responseId: string | undefined
      let responseModel: string | undefined
      let responseCreated: number | undefined
      let finishReason: string | null = null
      let usage: LLMStreamChunk['usage']

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed: LLMStreamChunk = JSON.parse(data)

            responseId = parsed.id ?? responseId
            responseModel = parsed.model ?? responseModel
            responseCreated = parsed.created ?? responseCreated

            const choice = parsed.choices?.[0]
            const delta = choice?.delta

            if (choice?.finish_reason) {
              finishReason = choice.finish_reason
            }
            if (parsed.usage) {
              usage = parsed.usage
            }

            if (
              firstTokenTime === null &&
              (delta?.content || (delta?.tool_calls && delta.tool_calls.length > 0))
            ) {
              firstTokenTime = (performance.now() - startTime) / 1000
            }

            if (delta?.content) {
              fullContent += delta.content
              onEvent({ content: delta.content })
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: '', name: '', arguments: '' }
                }
                if (tc.id) toolCalls[idx].id = tc.id
                if (tc.function?.name) toolCalls[idx].name += tc.function.name
                if (tc.function?.arguments) {
                  toolCalls[idx].arguments += tc.function.arguments
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse LLM chunk:', parseError)
          }
        }
      }

      const endTime = (performance.now() - startTime) / 1000

      const message: Record<string, unknown> = {
        role: 'assistant',
        content: fullContent
      }
      if (toolCalls.length > 0) {
        message.tool_calls = toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments }
        }))
      }

      const finalResponse = {
        id: responseId,
        object: 'chat.completion',
        model: responseModel,
        created: responseCreated,
        choices: [
          {
            index: 0,
            message,
            finish_reason: finishReason
          }
        ],
        usage
      }

      const promptTokens = usage?.prompt_tokens ?? 0
      const completionTokens = usage?.completion_tokens ?? 0
      const totalTokens =
        usage?.total_tokens ?? promptTokens + completionTokens
      const generationDuration = Math.max(
        0,
        endTime - (firstTokenTime ?? endTime)
      )
      const promptEvalDuration = firstTokenTime ?? 0

      console.log('\n=== EVAL LLM RESPONSE ===')
      console.log(JSON.stringify(finalResponse, null, 2))
      console.log('========================\n')

      onEvent({
        response: finalResponse,
        metrics: {
          promptTokens,
          completionTokens,
          totalTokens,
          promptEvalDuration,
          generationDuration,
          timeToFirstToken: firstTokenTime ?? 0
        }
      })

      onEvent({ done: true })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Evaluation LLM request aborted by client disconnect')
        return
      }

      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Evaluation stream error:', errorMsg)
      onEvent({ error: errorMsg })
      throw error
    }
  }
}
