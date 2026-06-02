import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// ==================== Type Definitions ====================

/** Backend success response body */
export interface ApiResponse<T> {
  success: true
  data: T
}

/** Backend error response body */
export interface ApiError {
  success: false
  error: string
  details?: unknown
}

/** Error codes for different error types */
export type ErrorCode =
  | 'BUSINESS_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'FORMAT_ERROR'
  | 'UNKNOWN_ERROR'

/** Unified custom request error class */
export class ApiRequestError extends Error {
  public status: number
  public code: ErrorCode
  public details: unknown

  constructor(message: string, status: number, code: ErrorCode = 'UNKNOWN_ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// ==================== Axios Instance ====================

const baseURL = (process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ==================== Request Interceptor ====================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // const token = localStorage.getItem('token')
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ==================== Response Interceptor ====================

apiClient.interceptors.response.use(
  // Success interceptor: unwraps response and returns business data
  (response) => {
    const body = response.data
    if (body && body.success === true) {
      return body.data
    }
    return Promise.reject(
      new ApiRequestError('Unexpected response format', response.status, 'FORMAT_ERROR')
    )
  },
  // Error interceptor: wraps all errors as ApiRequestError
  (error: AxiosError<ApiError>) => {
    // Server returned business error
    if (error.response?.data && error.response.data.success === false) {
      return Promise.reject(
        new ApiRequestError(
          error.response.data.error || 'An unexpected error occurred',
          error.response.status,
          'BUSINESS_ERROR',
          error.response.data.details
        )
      )
    }

    // Request timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiRequestError('Request timeout', 408, 'TIMEOUT'))
    }

    // Network error (no response)
    if (!error.response) {
      return Promise.reject(new ApiRequestError('Network error', 0, 'NETWORK_ERROR'))
    }

    // Other HTTP errors
    return Promise.reject(new ApiRequestError(error.message, error.response.status, 'HTTP_ERROR'))
  }
)
