import { ArrowLeft, Calendar, ChevronRight, CircleAlert, Home, LayoutGrid, Sparkles, SlidersHorizontal, Users, Workflow } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { PriorityTag } from '../components/openings/OpeningCard'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { useAppStore } from '../store/useAppStore'

const TABS = [
  { to: '', label: 'Overview', end: true, icon: LayoutGrid },
  { to: 'candidates', label: 'Candidates', end: false, icon: Users },
  { to: 'pipeline', label: 'Pipeline', end: false, icon: Workflow },
  { to: 'interviews', label: 'Interviews', end: false, icon: Calendar },
  { to: 'criteria', label: 'Hiring Criteria', end: false, icon: SlidersHorizontal },
]

export function RoleWorkspaceLayout() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const navigate = useNavigate()

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

  const criteriaCount = getCriteria(opening.id).length

  return (
    <div>
      <div className="border-b border-border bg-card px-8 pt-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/openings')}
            aria-label="Back"
            className="rounded-md p-1 hover:bg-muted hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link to="/" aria-label="Home" className="hover:text-palette-neutral-900">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
          <Link to="/openings" className="hover:text-palette-neutral-900">
            My Openings
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
          <span className="text-palette-neutral-700">{opening.title}</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{opening.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {opening.totalCandidates} candidates
              </span>
              {opening.needsAttention > 0 && (
                <span className="inline-flex items-center gap-1.5 text-palette-warning-700">
                  <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  {opening.needsAttention} need attention
                </span>
              )}
              {opening.newSinceLastReview !== undefined && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {opening.newSinceLastReview} new since last review
                </span>
              )}
            </div>
          </div>
          <PriorityTag priority={opening.priority} />
        </div>

        <nav className="mt-4 -mb-px flex items-center gap-5" aria-label="Role sections">
          {TABS.map((tab) => {
            const count = tab.to === 'candidates' ? opening.totalCandidates : tab.to === 'criteria' ? criteriaCount : undefined
            return (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none',
                    isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-palette-neutral-900',
                  )
                }
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
                {!!count && <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>}
              </NavLink>
            )
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
