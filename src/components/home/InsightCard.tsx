import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HomeInsight } from '../../data/insights'

export function InsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{insight.openingTitle}</p>
      <h3 className="mt-1 text-sm font-semibold text-neutral-900">{insight.headline}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{insight.detail}</p>
      {insight.action && (
        <Link
          to={insight.action.to}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {insight.action.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
