import { Bot, Briefcase, CheckCheck, Home, Settings, Sparkles, Users, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAttentionCount } from '../../store/useAgentStore'
import { useOpenTasks, useWorkspaceStore } from '../../store/useWorkspaceStore'

/**
 * HireFlow V2 navigation is organised around work, not records: Home asks what to get done, the
 * AI Workspace holds delegated tasks, Jobs and Candidates keep direct access to structured ATS data
 * (each job still owns its pipeline, interviews and criteria), and Approvals is the one place
 * where proposed actions wait for a person.
 */
const NAV = [
  { to: '/', label: 'Home', icon: Home, isActive: (p: string) => p === '/' },
  { to: '/workspace', label: 'AI Workspace', icon: Sparkles, isActive: (p: string) => p.startsWith('/workspace') },
  { to: '/openings', label: 'Jobs', icon: Briefcase, isActive: (p: string) => p.startsWith('/openings') },
  { to: '/candidates', label: 'Candidates', icon: Users, isActive: (p: string) => p.startsWith('/candidates') },
  { to: '/agents', label: 'AI Agents', icon: Bot, isActive: (p: string) => p.startsWith('/agents') },
  { to: '/activity', label: 'Approvals & activity', icon: CheckCheck, isActive: (p: string) => p.startsWith('/activity') || p === '/notifications' },
]

export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const { pathname } = useLocation()
  const agentAttention = useAttentionCount()
  const workspaceApprovals = useWorkspaceStore((state) => state.pendingApprovals())
  const openTasks = useOpenTasks().filter((task) => task.status !== 'completed').length

  const badges: Record<string, { value: number; label: string } | undefined> = {
    '/workspace': openTasks ? { value: openTasks, label: `${openTasks} open tasks` } : undefined,
    '/activity': agentAttention + workspaceApprovals ? { value: agentAttention + workspaceApprovals, label: 'waiting on you' } : undefined,
  }

  return (
    <aside className={cn('flex h-full w-60 shrink-0 flex-col border-r border-border bg-card', className)}>
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-palette-brand-500 text-sm font-semibold text-white shadow-sm">H</span>
        <span className="text-sm font-semibold text-palette-neutral-900">HireFlow</span>
        {onNavigate && (
          <button type="button" onClick={onNavigate} className="ml-auto rounded-md p-1 text-palette-neutral-500 hover:bg-muted" aria-label="Close navigation">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV.map((item) => {
          const active = item.isActive(pathname)
          const badge = badges[item.to]
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-palette-brand-100 font-semibold text-palette-brand-700' : 'text-palette-neutral-600 hover:bg-muted hover:text-palette-neutral-900',
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    item.to === '/activity' ? 'bg-palette-warning-150 text-palette-warning-700' : 'bg-palette-neutral-200 text-palette-neutral-700',
                  )}
                  aria-label={`${badge.value} ${badge.label}`}
                >
                  {badge.value}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            pathname === '/settings' ? 'bg-palette-brand-100 text-palette-brand-700' : 'text-palette-neutral-600 hover:bg-muted',
          )}
        >
          <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2.5 px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-xs font-semibold text-palette-brand-700">P</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium text-palette-neutral-900">Priya Sharma</span>
            <span className="block truncate text-xs text-muted-foreground">Hiring Manager</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
