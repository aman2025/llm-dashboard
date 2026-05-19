import { createRouter, createRoute, createRootRoute, Link, Outlet } from "@tanstack/react-router"
import DashboardPage from "../modules/dashboard"
import SettingsPage from "../modules/settings"
import ChatPage from "../modules/ai-chat"

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <nav className="flex items-center justify-center gap-8 p-4">
          <Link to="/" className="text-sm font-medium">Dashboard</Link>
          <Link to="/settings" className="text-sm font-medium">Settings</Link>
          <Link to="/chat" className="text-sm font-medium">AI Chat</Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto flex items-center justify-center">
        <Outlet />
      </main>
    </div>
  )
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: ChatPage
})

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, chatRoute])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}