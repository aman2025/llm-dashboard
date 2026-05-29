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
