import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Brain, LayoutDashboard, Settings, MessageSquare } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'AI Chat', path: '/chat', icon: MessageSquare },
  { name: 'Settings', path: '/settings', icon: Settings }
] as const

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo + Project Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-wide text-foreground">
                LLM-DASHBOARD
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                v1.2
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              EVALUATION ENGINE
            </span>
          </div>
        </div>

        {/* Middle: Navigation */}
        <nav className="flex items-center gap-2 rounded-[19px] border border-[#1f2738] bg-[#0f1219] px-2" style={{ height: '38px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md',
                  'text-sm font-normal transition-all duration-200',
                  'text-[#97a2b9]',
                  'hover:text-[#fafafd]',
                  'data-[status=active]:bg-transparent data-[status=active]:text-[#fafafd] data-[status=active]:font-bold'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: System Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              VRAM Footprint:
            </span>
            <span className="text-xs font-semibold text-foreground">
              2.2 GB
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
