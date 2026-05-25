import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes/router'
import { ToastProvider } from './components/ui/toaster'
import { QueryProvider } from './components/providers/query-provider'

export function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryProvider>
  )
}

export default App
