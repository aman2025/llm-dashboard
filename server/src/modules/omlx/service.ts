import { AppError } from '@/lib/errors'

const OMLX_URL = 'http://192.168.2.8:8000/api/status'
const API_KEY = 'zr425899'
const TIMEOUT_MS = 3000

export const omlxService = {
  async getStatus(): Promise<unknown> {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(OMLX_URL, {
        signal: ac.signal,
        headers: { Authorization: `Bearer ${API_KEY}` }
      })
      if (!res.ok) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Omlx server returned ${res.status} ${res.statusText}`,
          502
        )
      }
      return await res.json()
    } catch (err) {
      if (err instanceof AppError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('INTERNAL_ERROR', 'Omlx server timed out', 504)
      }
      throw new AppError('INTERNAL_ERROR', 'Omlx server unreachable', 502)
    } finally {
      clearTimeout(timer)
    }
  }
}
