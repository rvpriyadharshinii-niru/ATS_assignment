import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAppStore } from '../../store/useAppStore'
import { CopilotLauncher } from '../copilot/CopilotLauncher'
import { CopilotPanel } from '../copilot/CopilotPanel'

const NAV_ITEMS = [
  { to: '/', label: 'Home', isActive: (pathname: string) => pathname === '/' },
  { to: '/openings', label: 'My Openings', isActive: (pathname: string) => pathname === '/openings' },
  {
    to: '/openings/senior-product-designer',
    label: 'Candidates',
    isActive: (pathname: string) => pathname.startsWith('/openings/senior-product-designer') || pathname.startsWith('/candidates'),
  },
]

export function AppShell() {
  const copilotExpanded = useAppStore((state) => state.copilotExpanded)
  const { pathname } = useLocation()

  return (
    <div className="min-h-svh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-8">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">Hiring Workspace</span>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  item.isActive(pathname) ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-8 py-8">
        <Outlet />
      </main>

      {copilotExpanded ? <CopilotPanel /> : <CopilotLauncher />}
    </div>
  )
}
