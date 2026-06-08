import { apiClient } from '@/api/axios'
import type { OmlxStatus } from './omlx.types'

export const omlxApi = {
  getStatus: async (
    options?: { timeout?: number }
  ): Promise<OmlxStatus> => {
    return apiClient.get('/omlx/status', options)
  }
}
