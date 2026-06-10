export const evaluationApi = {
  getStreamUrl: (): string => {
    const baseURL = (
      process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api'
    ).replace(/\/+$/, '')
    return `${baseURL}/evaluation/stream`
  }
}
