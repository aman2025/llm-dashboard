export class AppError extends Error {
  constructor(
    public code:
      | 'NOT_FOUND'
      | 'VALIDATION_ERROR'
      | 'CONFLICT'
      | 'INTERNAL_ERROR',
    message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}
