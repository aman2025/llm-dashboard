import {
  QueryClient,
  QueryClientProvider,
  QueryCache
} from '@tanstack/react-query'
import { useState } from 'react'
import { ApiRequestError } from '@/api/axios'
import { emitToast } from '@/components/ui/toaster'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      // Skip if query opts out of global error toast
      if (
        (query as { meta?: { skipGlobalToast?: boolean } }).meta
          ?.skipGlobalToast
      ) {
        return
      }

      // Only show toast for non-business errors
      if (error instanceof ApiRequestError && error.code !== 'BUSINESS_ERROR') {
        emitToast({
          message: error.message,
          variant: 'error'
        })
      }
    }
  })

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1
          },
          mutations: {
            onError: (error, _variables, _context, mutation) => {
              // Skip if mutation opts out of global error toast
              if (mutation?.meta?.skipGlobalToast) {
                return
              }

              // Only show toast for non-business errors (timeout, network, HTTP)
              if (
                error instanceof ApiRequestError &&
                error.code !== 'BUSINESS_ERROR'
              ) {
                emitToast({
                  message: error.message,
                  variant: 'error'
                })
              }
            }
          }
        },
        queryCache
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
