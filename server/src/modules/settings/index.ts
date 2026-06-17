import { Elysia } from 'elysia'
import { settingsService } from './service'
import { Models } from './models'
import { AppError } from '@/lib/errors'

export const settingsRouter = new Elysia({ prefix: '/settings' })
  .get('/', async () => {
    return await settingsService.getSettings()
  })
  .get('/llm-models', async () => {
    return await settingsService.getAllLlmModels()
  })
  .patch('/active-llm', async ({ body }) => {
    const parseResult = Models.updateActiveLlm.safeParse(body)
    if (!parseResult.success) {
      throw new AppError('VALIDATION_ERROR', 'Validation failed')
    }
    return await settingsService.setActiveLlm(parseResult.data.llmId)
  })
  .patch('/evaluation-params', async ({ body }) => {
    const parseResult = Models.updateEvaluationParams.safeParse(body)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new AppError(
        'VALIDATION_ERROR',
        firstIssue?.message ?? 'Validation failed'
      )
    }
    return await settingsService.updateEvaluationParams(parseResult.data)
  })
