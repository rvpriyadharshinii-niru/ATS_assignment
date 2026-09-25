import { Briefcase, ChevronRight, CircleAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePipelineStages } from '../../store/candidateSelectors'
import type { Opening } from '../../types/domain'
import { cn } from '../../lib/cn'

const PRIORITY_TONE: Record<Opening['priority'], string> = {
  High: 'bg-palette-warning-150 text-palette-warning-700',
  Medium: 'bg-palette-info-150 text-palette-info-700',
  Normal: 'bg-palette-neutral-150 text-palette-neutral-600',
}

export function PriorityTag({ priority }: { priority: Opening['priority'] }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_TONE[priority])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {priority} priority
    </span>
  )
}

export function OpeningCard({ opening, compact = false }: { opening: Opening; compact?: boolean }) {
  const stages = usePipelineStages(opening.id).filter((stage) => stage.count > 0)

  if (compact) {
    return (
      <Link
        to={`/openings/${opening.id}`}
        className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="text-sm font-semibold text-palette-neutral-900">{opening.title}</span>
          <PriorityTag priority={opening.priority} />
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">{opening.situationSummary}</p>
        <ChevronRight className="h-4 w-4 shrink-0 text-palette-neutral-300" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <Link
      to={`/openings/${opening.id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-palette-brand-250 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-palette-brand-100 text-primary">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
        </span>
        <PriorityTag priority={opening.priority} />
      </div>

      <h3 className="mt-3 text-base font-semibold text-palette-neutral-900">{opening.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{opening.situationSummary}</p>

      {stages.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {stages.map((stage) => (
            <div key={stage.stage} className="h-1.5 flex-1 rounded-full bg-palette-brand-150" style={{ opacity: 0.4 + stage.count / 50 }} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {opening.totalCandidates}
          </span>
          {opening.needsAttention > 0 && (
            <span className="inline-flex items-center gap-1.5 text-palette-warning-700">
              <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {opening.needsAttention}
            </span>
          )}
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-xs font-semibold text-palette-brand-700">
          P
        </span>
      </div>
    </Link>
  )
}
