import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/layout'
import DashboardPage from '../modules/dashboard'
import SettingsPage from '../modules/settings'
import ChatPage from '../modules/ai-chat'
import EvaluationPage from '../modules/evaluation'

const rootRoute = createRootRoute({
  component: AppLayout
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: ChatPage
})

const evaluationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/evaluation',
  component: EvaluationPage
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  chatRoute,
  evaluationRoute
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
