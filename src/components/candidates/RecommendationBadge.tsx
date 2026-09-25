import type { RecommendationLabel } from '../../types/domain'
import { cn } from '../../lib/cn'

const TONE: Record<RecommendationLabel, string> = {
  'Strong match': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  'Good match': 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  Promising: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  'Potential match': 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-500/15',
  'Needs more information': 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
}

export function RecommendationBadge({ label }: { label: RecommendationLabel }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', TONE[label])}>
      {label}
    </span>
  )
}
