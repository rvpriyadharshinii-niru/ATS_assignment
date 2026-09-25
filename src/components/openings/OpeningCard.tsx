import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Opening } from '../../types/domain'
import { cn } from '../../lib/cn'

const PRIORITY_TONE: Record<Opening['priority'], string> = {
  High: 'bg-palette-warning-150 text-palette-warning-700 ring-palette-warning-400/40',
  Medium: 'bg-palette-neutral-150 text-palette-neutral-600 ring-palette-neutral-400/30',
  Normal: 'bg-palette-neutral-150 text-palette-neutral-500 ring-palette-neutral-400/20',
}

function PriorityTag({ priority }: { priority: Opening['priority'] }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] ring-1 ring-inset',
        PRIORITY_TONE[priority],
      )}
    >
      {priority}
    </span>
  )
}

export function OpeningCard({ opening, compact = false }: { opening: Opening; compact?: boolean }) {
  if (compact) {
    const row = (
      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="text-sm font-semibold text-palette-neutral-900">{opening.title}</span>
          <PriorityTag priority={opening.priority} />
        </div>
        <p className="font-sans hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">{opening.situationSummary}</p>
        {opening.hasDetailedData && <ChevronRight className="h-4 w-4 shrink-0 text-palette-neutral-300" aria-hidden="true" />}
      </div>
    )
    if (!opening.hasDetailedData) return row
    return (
      <Link
        to={`/openings/${opening.id}`}
        className="block transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {row}
      </Link>
    )
  }

  const content = (
    <>
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
      <p className="font-sans mt-3 text-sm text-foreground">{opening.situationSummary}</p>
    </>
  )

  if (!opening.hasDetailedData) {
    return <div className="rounded-xl border border-border bg-card p-5">{content}</div>
  }

  return (
    <Link
      to={`/openings/${opening.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-palette-neutral-300 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        View candidates
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
