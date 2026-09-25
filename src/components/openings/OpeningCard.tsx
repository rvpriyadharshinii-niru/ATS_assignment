import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Opening } from '../../types/domain'
import { cn } from '../../lib/cn'

const PRIORITY_TONE: Record<Opening['priority'], string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Medium: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Normal: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15',
}

function PriorityTag({ priority }: { priority: Opening['priority'] }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
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
          <span className="text-sm font-semibold text-neutral-900">{opening.title}</span>
          <PriorityTag priority={opening.priority} />
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-neutral-500 sm:block">{opening.situationSummary}</p>
        {opening.hasDetailedData && <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />}
      </div>
    )
    if (!opening.hasDetailedData) return row
    return (
      <Link
        to={`/openings/${opening.id}`}
        className="block transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        {row}
      </Link>
    )
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{opening.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {opening.totalCandidates} candidates
            {opening.needsAttention > 0 && <span className="text-neutral-400"> · {opening.needsAttention} need attention</span>}
          </p>
        </div>
        <PriorityTag priority={opening.priority} />
      </div>
      <p className="mt-3 text-sm text-neutral-600">{opening.situationSummary}</p>
    </>
  )

  if (!opening.hasDetailedData) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-5">{content}</div>
  }

  return (
    <Link
      to={`/openings/${opening.id}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {content}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
        View candidates
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
