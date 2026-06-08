import { Elysia } from 'elysia'
import { settingsRouter } from '@/modules/settings'
import { chatModule } from '@/modules/chat'
import { macmonModule } from '@/modules/macmon'
import { omlxModule } from '@/modules/omlx'

export const apiRouter = new Elysia({ prefix: '/api' })
  .use(settingsRouter)
  .use(chatModule)
  .use(macmonModule)
  .use(omlxModule)
