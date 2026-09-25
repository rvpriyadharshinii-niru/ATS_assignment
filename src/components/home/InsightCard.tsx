import { Link } from 'react-router-dom'
import type { HomeInsight } from '../../data/insights'

export function InsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-palette-brand-600">{insight.openingTitle}</p>
        <h3 className="mt-1 text-[15px] font-semibold text-palette-neutral-900">{insight.headline}</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
      </div>
      {insight.action && (
        <Link
          to={insight.action.to}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[image:var(--gradient-brand_wash)] px-3.5 py-2 text-sm font-medium text-background shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {insight.action.label}
        </Link>
      )}
    </div>
  )
}
