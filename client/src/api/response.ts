import type { AxiosResponse } from 'axios'

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export function unwrapResponse<T>(response: AxiosResponse<ApiResult<T>>): T {
  const { data } = response

  if (!data.success) {
    throw new Error(data.error || 'Unknown API error')
  }

  return data.data
}