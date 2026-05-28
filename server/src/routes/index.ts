import { Elysia } from 'elysia'
import { settingsRouter } from '@/modules/settings'
import { chatModule } from '@/modules/chat'

export const apiRouter = new Elysia({ prefix: '/api' }).use(settingsRouter).use(chatModule)
