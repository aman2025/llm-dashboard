import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  createdAt: string
}

export interface ChatSession {
  id: string
  modelName: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  createSession: (modelName: string) => string
  deleteSession: (sessionId: string) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<Pick<ChatMessage, 'content' | 'reasoning'>>
  ) => void
  setActiveSession: (sessionId: string | null) => void
  loadSession: (session: ChatSession) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (modelName) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newSession: ChatSession = {
          id,
          modelName,
          messages: [],
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: id
        }))
        return id
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
        }))
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: new Date().toISOString()
                }
              : s
          )
        }))
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
                  updatedAt: new Date().toISOString()
                }
              : s
          )
        }))
      },

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

      loadSession: (session) => {
        set((state) => {
          const existingIndex = state.sessions.findIndex((s) => s.id === session.id)
          if (existingIndex >= 0) {
            const newSessions = [...state.sessions]
            newSessions[existingIndex] = session
            return { sessions: newSessions }
          }
          return { sessions: [...state.sessions, session] }
        })
      }
    }),
    {
      name: 'chat-storage'
    }
  )
)
