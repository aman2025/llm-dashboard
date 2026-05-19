import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Settings', path: '/settings' },
  { name: 'AI Chat', path: '/chat' }
] as const

export function Header() {
  return (
    <header className="border-b">
      <nav className="flex items-center justify-center gap-8 p-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              'data-[active]:text-primary data-[active]:underline'
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  )
}