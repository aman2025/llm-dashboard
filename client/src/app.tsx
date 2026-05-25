import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes/router'
import { ToastProvider } from './components/ui/toaster'

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}

export default App
