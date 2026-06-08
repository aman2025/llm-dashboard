import { AppError } from '@/lib/errors'

const MACMON_URL = 'http://192.168.2.8:9090/json'
const TIMEOUT_MS = 2000

export const macmonService = {
  async getSnapshot(): Promise<unknown> {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(MACMON_URL, { signal: ac.signal })
      if (!res.ok) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Macmon daemon returned ${res.status} ${res.statusText}`,
          502
        )
      }
      return await res.json()
    } catch (err) {
      if (err instanceof AppError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('INTERNAL_ERROR', 'Macmon daemon timed out', 504)
      }
      throw new AppError('INTERNAL_ERROR', 'Macmon daemon unreachable', 502)
    } finally {
      clearTimeout(timer)
    }
  }
}
