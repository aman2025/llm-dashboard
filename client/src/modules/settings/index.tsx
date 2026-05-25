import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toaster'
import { useSettings, useUpdateSettings } from './hooks/use-settings'

export default function SettingsPage() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [language, setLanguage] = useState('')
  const { addToast } = useToast()

  const handleUpdate = () => {
    if (!language.trim()) return
    updateSettings.mutate(
      { interfaceLanguage: language },
      {
        onSuccess: () => {
          addToast({ message: 'Settings updated', variant: 'success' })
          setLanguage('')
        },
        onError: (error) => {
          addToast({ message: error.message, variant: 'error' })
        }
      }
    )
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Interface Language</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder={settings?.interfaceLanguage || 'en'}
            />
          </div>
          <Button onClick={handleUpdate} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  )
}
