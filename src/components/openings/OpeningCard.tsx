import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPipelineStages } from '../../data/pipeline'
import type { Opening } from '../../types/domain'
import { cn } from '../../lib/cn'

const PRIORITY_TONE: Record<Opening['priority'], string> = {
  High: 'bg-palette-warning-150 text-palette-warning-700',
  Medium: 'bg-palette-neutral-150 text-palette-neutral-600',
  Normal: 'bg-palette-neutral-150 text-palette-neutral-500',
}

function PriorityTag({ priority }: { priority: Opening['priority'] }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_TONE[priority])}>
      {priority} priority
    </span>
  )
}

export function OpeningCard({ opening, compact = false }: { opening: Opening; compact?: boolean }) {
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

  const stages = getPipelineStages(opening.id).filter((stage) => stage.count > 0)

  return (
    <Link
      to={`/openings/${opening.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-palette-brand-250 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-palette-neutral-900">{opening.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {opening.totalCandidates} candidates
            {opening.needsAttention > 0 && <span className="text-palette-neutral-400"> · {opening.needsAttention} need attention</span>}
          </p>
        </div>
        <PriorityTag priority={opening.priority} />
      </div>

      <p className="mt-3 text-sm text-foreground">{opening.situationSummary}</p>

      {stages.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {stages.map((stage) => (
            <div key={stage.stage} className="h-1.5 flex-1 rounded-full bg-palette-brand-150" style={{ opacity: 0.4 + stage.count / 50 }} />
          ))}
        </div>
      )}

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Open workspace
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
