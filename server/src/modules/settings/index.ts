import { Elysia } from 'elysia'
import { settingsService } from './service'
import { Models } from './models'
import { AppError } from '@/lib/errors'

export const settingsRouter = new Elysia({ prefix: '/settings' })
  .get('/', async () => {
    return await settingsService.getSettings()
  })
  .patch('/', async ({ body }) => {
    const parseResult = Models.update.safeParse(body)
    if (!parseResult.success) {
      throw new AppError('VALIDATION_ERROR', 'Validation failed')
    }
    return await settingsService.updateSettings(parseResult.data)
  })
  .post('/llm-names', async ({ body }) => {
    const parseResult = Models.addLlmName.safeParse(body)
    if (!parseResult.success) {
      throw new AppError('VALIDATION_ERROR', 'Validation failed')
    }
    return await settingsService.addLlmName(parseResult.data.name)
  })
  .delete('/llm-names/:name', async ({ params }) => {
    const name = decodeURIComponent(params.name)
    return await settingsService.removeLlmName(name)
  })
