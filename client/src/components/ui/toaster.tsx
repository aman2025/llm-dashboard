import * as React from 'react'
import { Toast } from './toast'
import { cn } from '@/lib/utils'

interface ToasterProps {
  className?: string
}

interface ToastItem {
  id: string
  message: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'info'
  onClose?: () => void
}

interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const toastEventEmitter = typeof window !== 'undefined' ? new EventTarget() : null

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function emitToast(toast: Omit<ToastItem, 'id'>) {
  toastEventEmitter?.dispatchEvent(new CustomEvent('toast', { detail: toast }))
}

export function ToastProvider({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<ToastItem, 'id'>>
      addToast(customEvent.detail)
    }
    toastEventEmitter?.addEventListener('toast', handler)
    return () => toastEventEmitter?.removeEventListener('toast', handler)
  }, [])

  const addToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
    if (toast.onClose) {
      setTimeout(() => {
        toast.onClose?.()
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    } else {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className={cn(
          'fixed top-4 right-4 z-50 flex flex-col gap-2',
          className
        )}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onClose={() => removeToast(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
