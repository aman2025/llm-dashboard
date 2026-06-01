import { Elysia, t } from 'elysia'
import { chatController } from './controller'
import type { SSEEvent } from './types'

export const chatModule = new Elysia({ prefix: '/chat' })
  .get('/sessions', async ({ set }) => {
    try {
      const sessions = await chatController.getSessions()
      return { success: true, data: sessions }
    } catch (error) {
      console.error('GET /sessions error:', error)
      set.status = 500
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sessions'
      }
    }
  })
  .post('/sessions', async ({ set }) => {
    try {
      const session = await chatController.createSession()
      return { success: true, data: { id: session.id } }
    } catch (error) {
      console.error('POST /sessions error:', error)
      set.status = 500
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session'
      }
    }
  })
  .get('/sessions/:id/messages', async ({ params, set }) => {
    try {
      const messages = await chatController.getMessages({ sessionId: params.id })
      return { success: true, data: messages }
    } catch (error) {
      console.error('GET /sessions/:id/messages error:', error)
      set.status = error instanceof Error && error.message === 'Session not found' ? 404 : 500
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    }
  })
  .delete('/sessions/:id', async ({ params, set }) => {
    try {
      const result = await chatController.deleteSession({ sessionId: params.id })
      return { success: true, data: result }
    } catch (error) {
      console.error('DELETE /sessions/:id error:', error)
      set.status = 500
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session'
      }
    }
  })
  .post(
    '/stream',
    async ({ body, set, request }) => {
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
          
          // Create an AbortController to detect client disconnection
          const abortController = new AbortController()
          
          // Monitor for client disconnection
          const checkConnection = setInterval(() => {
            try {
              // Try to enqueue an empty comment to check if connection is alive
              // If the client disconnected, this will throw
              controller.enqueue(encoder.encode(': keepalive\n\n'))
            } catch (err) {
              console.log('Client disconnected')
              clearInterval(checkConnection)
              abortController.abort()
            }
          }, 1000)

          const sendEvent = (event: SSEEvent) => {
            try {
              const data = JSON.stringify(event)
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } catch (err) {
              console.error('Error sending SSE event:', err)
              clearInterval(checkConnection)
              abortController.abort()
            }
          }

          try {
            await chatController.streamChat(body, sendEvent, abortController.signal)
            clearInterval(checkConnection)
            controller.close()
          } catch (err) {
            clearInterval(checkConnection)
            console.error('Stream error:', err)
            
            // Only send error if not aborted
            if (err instanceof Error && err.name !== 'AbortError') {
              const errorMsg = err.message
              try {
                sendEvent({ error: errorMsg, done: true })
              } catch {
                // Ignore if can't send error (client disconnected)
              }
            }
            controller.close()
          }
        },
        cancel() {
          // Called when client closes the connection
          console.log('Stream cancelled by client')
        }
      })

      return stream
    },
    {
      body: t.Object({
        sessionId: t.Optional(t.String()),
        message: t.String()
      })
    }
  )