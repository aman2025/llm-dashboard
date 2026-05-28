import type { ChatStreamRequest } from './types'
import { chatService } from './service'
import { AppError } from '@/lib/errors'

export const chatController = {
  async createSession() {
    try {
      return await chatService.createSession()
    } catch (error) {
      console.error('Error creating session:', error)
      throw new AppError(
        'INTERNAL_ERROR',
        'Failed to create chat session',
        500
      )
    }
  },

  async getSessions() {
    try {
      return await chatService.getSessions()
    } catch (error) {
      console.error('Error getting sessions:', error)
      throw new AppError(
        'INTERNAL_ERROR',
        'Failed to fetch chat sessions',
        500
      )
    }
  },

  async getMessages({ sessionId }: { sessionId: string }) {
    try {
      // Verify session exists
      const session = await chatService.getSessionById(sessionId)
      if (!session) {
        throw new AppError('NOT_FOUND', 'Session not found', 404)
      }
      return await chatService.getMessages(sessionId)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error getting messages:', error)
      throw new AppError(
        'INTERNAL_ERROR',
        'Failed to fetch chat messages',
        500
      )
    }
  },

  async deleteSession({ sessionId }: { sessionId: string }) {
    try {
      await chatService.deleteSession(sessionId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting session:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to delete session', 500)
    }
  },

  async streamChat(req: ChatStreamRequest, onEvent: (event: any) => void) {
    try {
      return await chatService.streamChat(req, onEvent)
    } catch (error) {
      console.error('Error streaming chat:', error)
      throw error
    }
  }
}