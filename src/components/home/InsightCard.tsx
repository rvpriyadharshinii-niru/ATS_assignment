import { Link } from 'react-router-dom'
import type { HomeInsight } from '../../data/insights'

export function InsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-neutral-100 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-400">{insight.openingTitle}</p>
        <h3 className="mt-0.5 text-[15px] font-semibold text-neutral-900">{insight.headline}</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-500">{insight.detail}</p>
      </div>
      {insight.action && (
        <Link
          to={insight.action.to}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {insight.action.label}
        </Link>
      )}
    </div>
  )
}
