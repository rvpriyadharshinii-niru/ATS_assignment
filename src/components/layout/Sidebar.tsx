import { Bell, Briefcase, Home, Settings, Sparkles, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'

const PRIMARY_OPENING = 'senior-product-designer'

function isOpeningsRoot(pathname: string) {
  return pathname === '/openings' || /^\/openings\/[^/]+$/.test(pathname)
}
function isCandidatesRoute(pathname: string) {
  return pathname.endsWith('/candidates') || /^\/candidates\/[^/]+$/.test(pathname)
}

const MAIN_ITEMS = [
  { to: '/', label: 'Home', icon: Home, isActive: (p: string) => p === '/' },
  { to: '/openings', label: 'My Openings', icon: Briefcase, isActive: isOpeningsRoot },
  { to: `/openings/${PRIMARY_OPENING}/candidates`, label: 'Candidates', icon: Users, isActive: isCandidatesRoute },
]

const ACTIVITY_ITEMS = [{ to: '/notifications', label: 'Notifications', icon: Bell, isActive: (p: string) => p === '/notifications' }]

function NavRow({
  to,
  label,
  Icon,
  active,
  onClick,
}: {
  to?: string
  label: string
  Icon: typeof Home
  active: boolean
  onClick?: () => void
}) {
  const className = cn(
    'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active ? 'bg-palette-brand-150 text-palette-brand-700 font-semibold' : 'text-palette-neutral-600 hover:bg-muted hover:text-palette-neutral-900',
  )
  const content = (
    <>
      {active && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />}
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, 'w-full text-left')}>
        {content}
      </button>
    )
  }
  return (
    <Link to={to!} className={className}>
      {content}
    </Link>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wide text-palette-neutral-400">{children}</p>
}

export function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-brand_wash)] text-sm font-semibold text-background shadow-sm">
          H
        </span>
        <span className="text-sm font-semibold text-palette-neutral-900">Hiring Workspace</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        <SectionLabel>Main</SectionLabel>
        <div className="ml-3 space-y-0.5">
          {MAIN_ITEMS.map((item) => (
            <NavRow key={item.label} to={item.to} label={item.label} Icon={item.icon} active={item.isActive(pathname)} />
          ))}
        </div>

        <SectionLabel>Intelligence</SectionLabel>
        <div className="ml-3 space-y-0.5">
          <NavRow to="/copilot" label="Copilot" Icon={Sparkles} active={pathname === '/copilot'} />
        </div>

        <SectionLabel>Activity</SectionLabel>
        <div className="ml-3 space-y-0.5">
          {ACTIVITY_ITEMS.map((item) => (
            <NavRow key={item.label} to={item.to} label={item.label} Icon={item.icon} active={item.isActive(pathname)} />
          ))}
        </div>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="ml-3 space-y-0.5">
          <NavRow to="/settings" label="Settings" Icon={Settings} active={pathname === '/settings'} />
        </div>
        <Link
          to="/settings"
          className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-xs font-semibold text-palette-brand-700">
            P
          </span>
          <span className="min-w-0 text-left leading-tight">
            <span className="block truncate text-sm font-medium text-palette-neutral-900">Priya Sharma</span>
            <span className="block truncate text-xs text-muted-foreground">Hiring Manager</span>
          </span>
        </Link>
      </div>
    </aside>
  )
}
