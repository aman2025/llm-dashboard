import { Elysia, t } from 'elysia'
import { evaluationService } from './service'
import type { EvaluationSSEEvent } from './types'

export const evaluationModule = new Elysia({ prefix: '/evaluation' }).post(
  '/stream',
  async ({ body, set }) => {
    set.headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const abortController = new AbortController()

        const checkConnection = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'))
          } catch (err) {
            console.log('Client disconnected from evaluation stream')
            clearInterval(checkConnection)
            abortController.abort()
          }
        }, 1000)

        const sendEvent = (event: EvaluationSSEEvent) => {
          try {
            const data = JSON.stringify(event)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          } catch (err) {
            console.error('Error sending evaluation SSE event:', err)
            clearInterval(checkConnection)
            abortController.abort()
          }
        }

        try {
          await evaluationService.stream(body, sendEvent, abortController.signal)
          clearInterval(checkConnection)
          controller.close()
        } catch (err) {
          clearInterval(checkConnection)
          console.error('Evaluation stream error:', err)

          if (err instanceof Error && err.name !== 'AbortError') {
            const errorMsg = err.message
            try {
              sendEvent({ error: errorMsg, done: true })
            } catch {
              // ignore (client disconnected)
            }
          }
          controller.close()
        }
      },
      cancel() {
        console.log('Evaluation stream cancelled by client')
      }
    })

    return stream
  },
  {
    body: t.Object({
      message: t.String(),
      history: t.Array(
        t.Object({
          role: t.Union([t.Literal('user'), t.Literal('assistant')]),
          content: t.String()
        })
      )
    })
  }
)
