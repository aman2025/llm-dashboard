import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toaster'
import { Card } from '@/components/ui/card'

const API_BASE = 'http://192.168.2.8:8000'
const API_URL = `${API_BASE}/v1/chat/completions`
const API_KEY = 'zr425899'
const MODEL = 'MLX-Qwen3.5-9B-Claude-4.6-Opus-6bit'

interface Model {
  id: string
  object: string
  created: number
  owned_by: string
}

export default function DashboardPage() {
  const { addToast } = useToast()
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState(MODEL)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [modelsResponse, setModelsResponse] = useState<any>(null)
  const [statsResponse, setStatsResponse] = useState<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const headers = { Authorization: `Bearer ${API_KEY}` }

      try {
        const modelsRes = await axios.get(`${API_BASE}/v1/models`, { headers })
        setModels(modelsRes.data.data || [])
        setModelsResponse(modelsRes.data)
      } catch (err) {
        console.error('Failed to fetch models:', err)
      }

      try {
        const statsRes = await axios.get(`${API_BASE}/api/status`, { headers })
        setStatsResponse(statsRes.data)
      } catch (err) {
        console.warn('/api/status not available:', err)
      }

      setIsLoadingModels(false)
    }
    fetchAll()
  }, [])

  const testLLM = async () => {
    if (!input.trim()) {
      addToast({
        message: 'Please enter a message',
        variant: 'error'
      })
      return
    }

    setIsStreaming(true)
    setResponse('')
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: input }],
          stream: true
        }),
        signal: abortControllerRef.current.signal
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let buffer = ''
      let parsedData: any = null

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              parsedData = parsed
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                setResponse((prev) => prev + content)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }

      console.log('LLM Response:', parsedData)

      addToast({
        message: 'LLM response completed',
        variant: 'success'
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addToast({
          message: 'Request cancelled',
          variant: 'info'
        })
      } else {
        console.error('LLM test error:', error)
        addToast({
          message: `Error: ${error.message}`,
          variant: 'error'
        })
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault()
      testLLM()
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">LLM Connection Test</h1>
        <p className="text-sm text-gray-600">
          Testing connection to {selectedModel} at {API_URL}
        </p>
      </div>

      {modelsResponse && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-2">
            GET /v1/models Response:
          </h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
            {JSON.stringify(modelsResponse, null, 2)}
          </pre>
        </Card>
      )}

      {statsResponse && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-2">
            GET /api/status Response:
          </h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
            {JSON.stringify(statsResponse, null, 2)}
          </pre>
        </Card>
      )}

      <Card className="p-4 flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <span className="text-sm whitespace-nowrap">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md bg-background"
            disabled={isLoadingModels}
          >
            {isLoadingModels ? (
              <option>Loading models...</option>
            ) : (
              models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your message..."
            disabled={isStreaming}
            className="flex-1"
          />
          {isStreaming ? (
            <Button onClick={stopStreaming} variant="destructive">
              Stop
            </Button>
          ) : (
            <Button onClick={testLLM}>Send</Button>
          )}
        </div>
      </Card>

      {(response || isStreaming) && (
        <Card className="p-4">
          <div className="border rounded-lg p-4 min-h-[200px] max-h-[500px] overflow-y-auto bg-transparent">
            <div className="whitespace-pre-wrap">{response}</div>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-800 animate-pulse ml-1" />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
