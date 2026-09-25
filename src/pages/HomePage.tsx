import { useEffect } from 'react'
import { InsightCard } from '../components/home/InsightCard'
import { OpeningCard } from '../components/openings/OpeningCard'
import { globalMetrics, openings } from '../data/openings'
import { homeInsights } from '../data/insights'
import { useAppStore } from '../store/useAppStore'

const METRICS = [
  { label: 'Active Roles', value: globalMetrics.activeRoles },
  { label: 'Candidates', value: globalMetrics.totalCandidates },
  { label: 'Need Attention', value: globalMetrics.needAttention },
  { label: 'Interviews This Week', value: globalMetrics.interviewsThisWeek },
]

export function HomePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Good morning, Priya</h1>
        <p className="mt-1 text-neutral-500">Here is what needs your attention today.</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-500">
          {METRICS.map((metric, index) => (
            <span key={metric.label} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-neutral-300" aria-hidden="true">
                  ·
                </span>
              )}
              <span className="font-semibold text-neutral-700">{metric.value}</span>
              <span>{metric.label}</span>
            </span>
          ))}
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold text-neutral-900">Needs your attention</h2>
        <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-5">
          {homeInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-neutral-900">My Openings</h2>
        <div className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
          {openings.map((opening) => (
            <OpeningCard key={opening.id} opening={opening} compact />
          ))}
        </div>
      </section>
    </div>
  )
}
