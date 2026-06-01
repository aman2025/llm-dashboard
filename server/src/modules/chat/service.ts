import { prisma } from '@/lib/prisma'
import { settingsService } from '@/modules/settings/service'
import type {
  ChatStreamRequest,
  SSEEvent,
  LLMMessage,
  LLMStreamChunk
} from './types'

const API_URL = 'http://192.168.2.8:8000/v1/chat/completions'
const API_KEY = 'zr425899'
const SYSTEM_PROMPT = 'You are a helpful AI assistant.'

export const chatService = {
  async createSession() {
    return prisma.chatSession.create({ data: {} })
  },

  async getSessionById(sessionId: string) {
    return prisma.chatSession.findUnique({
      where: { id: sessionId }
    })
  },

  async deleteSession(sessionId: string) {
    return prisma.chatSession.delete({ where: { id: sessionId } })
  },

  async getSessions() {
    try {
      const sessions = await prisma.chatSession.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      return sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        messageCount: s._count.messages,
        lastMessage: s.messages[0]?.content.slice(0, 50)
      }))
    } catch (error) {
      console.error('Database error in getSessions:', error)
      throw error
    }
  },

  async getMessages(sessionId: string) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      })
      return messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        reasoning: m.reasoning || undefined,
        createdAt: m.createdAt.toISOString()
      }))
    } catch (error) {
      console.error('Database error in getMessages:', error)
      throw error
    }
  },

  async streamChat(req: ChatStreamRequest, onEvent: (event: SSEEvent) => void, abortSignal?: AbortSignal) {
    // Create an AbortController for the LLM API request
    const llmAbortController = new AbortController()
    
    // If client disconnects, abort the LLM request
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        console.log('Client disconnected, aborting LLM request')
        llmAbortController.abort()
      })
    }

    try {
      // 0. Get active model from settings
      const settings = await settingsService.getSettings()
      const activeModel = settings.activeLlm?.name
      
      if (!activeModel) {
        throw new Error('No active LLM model configured. Please select a model in settings.')
      }

      // 1. Create session if needed
      let sessionId = req.sessionId
      if (!sessionId) {
        const session = await this.createSession()
        sessionId = session.id
        onEvent({ sessionId })
      } else {
        // Verify session exists
        const session = await this.getSessionById(sessionId)
        if (!session) {
          throw new Error('Session not found')
        }
      }

      // 2. Store user message
      await prisma.chatMessage.create({
        data: { sessionId, role: 'user', content: req.message }
      })
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      })

      // 3. Fetch history for context
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      })

      // 4. Build messages array for LLM
      const llmMessages: LLMMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content }))
      ]

      // 5. Stream from LLM API with abort signal
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages: llmMessages,
          stream: true
        }),
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
      let reasoningContent = ''
      let chunkCount = 0

      console.log('\n=== LLM STREAM START ===')
      console.log('Model:', activeModel)
      console.log('Session:', sessionId)

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

            // Log the full parsed chunk structure
            chunkCount++
            console.log(`\n--- Chunk ${chunkCount} ---`)
            console.log('Full parsed object:', JSON.stringify(parsed, null, 2))

            const delta = parsed.choices?.[0]?.delta

            // Handle regular content
            const content = delta?.content
            if (content) {
              console.log('Content delta:', JSON.stringify(content))
              fullContent += content
              onEvent({ content })
            }

            // Handle reasoning_content field (MLX-Qwen format)
            const reasoning = delta?.reasoning_content
            if (reasoning) {
              console.log('Reasoning delta:', JSON.stringify(reasoning))
              reasoningContent += reasoning
              // Stream reasoning updates to frontend
              onEvent({ reasoning: reasoningContent })
            }
          } catch (parseError) {
            // Ignore parse errors for malformed chunks
            console.error('Failed to parse LLM chunk:', parseError)
          }
        }
      }

      console.log('\n=== LLM STREAM END ===')
      console.log('Total chunks:', chunkCount)
      console.log('Full content length:', fullContent.length)
      console.log('Full content:', fullContent)
      console.log('Reasoning content:', reasoningContent || '(none detected)')
      console.log('========================\n')

      // 6. Store assistant message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: fullContent,
          reasoning: reasoningContent || null
        }
      })
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      })

      onEvent({ done: true })

      return { sessionId }
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('LLM request aborted by client disconnect')
        // Don't save partial message or throw error
        return { sessionId: req.sessionId || '' }
      }
      
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Stream error:', errorMsg)
      onEvent({ error: errorMsg })
      throw error
    }
  }
}
