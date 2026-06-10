import { useCallback, useRef, useState } from 'react'
import {
  evaluationApi,
  type EvaluationHistoryMessage,
  type EvaluationMetrics,
  type EvaluationResponsePayload,
  type EvaluationSSEEvent
} from '../api'

interface StreamCallbacks {
  onContent: (accumulated: string, delta: string) => void
  onComplete: (
    fullContent: string,
    finalResponse: EvaluationResponsePayload | null
  ) => void
}

export function useEvaluationStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastRequest, setLastRequest] = useState<unknown>(null)
  const [lastResponse, setLastResponse] = useState<EvaluationResponsePayload | null>(
    null
  )
  const [lastMetrics, setLastMetrics] = useState<EvaluationMetrics | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastResponseRef = useRef<EvaluationResponsePayload | null>(null)

  const startStream = useCallback(
    async (message: string, history: EvaluationHistoryMessage[], callbacks: StreamCallbacks) => {
      setIsStreaming(true)
      setLastRequest(null)
      setLastResponse(null)
      setLastMetrics(null)
      lastResponseRef.current = null

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(evaluationApi.getStreamUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history }),
          signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedContent = ''
        let completed = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const event: EvaluationSSEEvent = JSON.parse(data)

              if (event.error) {
                throw new Error(event.error)
              }

              if (event.request !== undefined) {
                setLastRequest(event.request)
              }

              if (event.response !== undefined) {
                const r = event.response as EvaluationResponsePayload
                setLastResponse(r)
                lastResponseRef.current = r
              }

              if (event.metrics) {
                setLastMetrics({
                  inputTokens: event.metrics.inputTokens ?? 0,
                  outputTokens: event.metrics.outputTokens ?? 0,
                  timeToFirstToken: event.metrics.timeToFirstToken ?? 0,
                  promptTokensPerSecond:
                    event.metrics.promptTokensPerSecond ?? 0,
                  generationTokensPerSecond:
                    event.metrics.generationTokensPerSecond ?? 0
                })
              }

              if (event.content !== undefined) {
                accumulatedContent += event.content
                callbacks.onContent(accumulatedContent, event.content)
              }

              if (event.done) {
                completed = true
                callbacks.onComplete(accumulatedContent, lastResponseRef.current)
                break
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message) {
                throw parseError
              }
              console.error('Failed to parse evaluation SSE event:', parseError)
            }
          }

          if (completed) break
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Evaluation stream aborted by user')
        } else {
          console.error('Evaluation stream error:', error)
          throw error
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    []
  )

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }, [])

  return {
    startStream,
    stopStream,
    isStreaming,
    lastRequest,
    lastResponse,
    lastMetrics
  }
}
