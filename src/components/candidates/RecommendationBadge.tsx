import type { RecommendationLabel } from '../../types/domain'
import { cn } from '../../lib/cn'

const TONE: Record<RecommendationLabel, string> = {
  'Strong match': 'bg-palette-success-150 text-palette-success-700 ring-1 ring-inset ring-palette-success-400/30',
  'Good match': 'bg-palette-info-150 text-palette-info-700 ring-1 ring-inset ring-palette-info-400/30',
  Promising: 'bg-palette-info-150 text-palette-info-700 ring-1 ring-inset ring-palette-info-400/30',
  'Potential match': 'bg-palette-neutral-150 text-palette-neutral-600 ring-1 ring-inset ring-palette-neutral-400/20',
  'Needs more information': 'bg-palette-warning-150 text-palette-warning-700 ring-1 ring-inset ring-palette-warning-400/30',
}

export function RecommendationBadge({ label }: { label: RecommendationLabel }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em]', TONE[label])}>
      {label}
    </span>
  )
}
