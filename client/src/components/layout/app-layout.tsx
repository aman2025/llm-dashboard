import { Outlet } from '@tanstack/react-router'
import { Header } from './header'

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}