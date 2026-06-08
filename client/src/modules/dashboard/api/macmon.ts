import { apiClient } from '@/api/axios'
import type { MacmonSnapshot } from './macmon.types'

export const macmonApi = {
  getSnapshot: async (
    options?: { timeout?: number }
  ): Promise<MacmonSnapshot> => {
    return apiClient.get('/macmon/snapshot', options)
  }
}
