import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'

export default function DashboardPage() {
  const { addToast } = useToast()

  const testToast = (variant: 'default' | 'success' | 'error' | 'info') => {
    addToast({
      message: `This is a ${variant} toast`,
      variant
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center gap-4">
        <Button onClick={() => testToast('default')}>Test Default Toast</Button>
        <Button onClick={() => testToast('success')}>Test Success Toast</Button>
        <Button onClick={() => testToast('error')}>Test Error Toast</Button>
        <Button onClick={() => testToast('info')}>Test Info Toast</Button>
      </div>
    </div>
  )
}
