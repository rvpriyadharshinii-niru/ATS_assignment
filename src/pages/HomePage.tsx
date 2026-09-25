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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Good morning, Priya</h1>
        <p className="mt-1 text-neutral-500">Here is what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-2xl font-semibold text-neutral-900">{metric.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Copilot Insights</h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {homeInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">My Openings</h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {openings.map((opening) => (
            <OpeningCard key={opening.id} opening={opening} />
          ))}
        </div>
      </section>
    </div>
  )
}
