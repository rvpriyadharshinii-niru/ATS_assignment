import { useEffect } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { useAppStore } from '../store/useAppStore'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'candidates', label: 'Candidates', end: false },
  { to: 'pipeline', label: 'Pipeline', end: false },
  { to: 'interviews', label: 'Interviews', end: false },
  { to: 'criteria', label: 'Hiring Criteria', end: false },
]

export function RoleWorkspaceLayout() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)

  useEffect(() => {
    if (opening) setSelectedOpening(opening.id)
  }, [opening, setSelectedOpening])

  if (!opening) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">This opening isn&rsquo;t available.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <p className="text-xs font-medium text-muted-foreground">Role Workspace</p>
        <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{opening.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opening.totalCandidates} candidates · {opening.situationSummary}
        </p>
        <nav className="mt-4 flex items-center gap-1" aria-label="Role sections">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'bg-palette-brand-100 text-palette-brand-700' : 'text-muted-foreground hover:bg-muted hover:text-palette-neutral-900',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
