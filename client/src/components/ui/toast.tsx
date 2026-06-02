import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'info'
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full',
          {
            'border-green-200 bg-green-50 text-green-900': variant === 'success',
            'border-red-200 bg-red-50 text-red-900': variant === 'error',
            'border-blue-200 bg-blue-50 text-blue-900': variant === 'info',
            'border-border bg-background text-foreground': variant === 'default'
          },
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = 'Toast'

export { Toast }
