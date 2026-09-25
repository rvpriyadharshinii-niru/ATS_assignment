import { SlidersHorizontal, Sparkles, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import type { OpeningId } from '../types/domain'

export function RoleWorkspaceOverviewPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const pool = useEffectiveCandidatesForOpening(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const stages = usePipelineStages(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)

  if (!opening) return null

  if (!opening.hasDetailedData) {
    return (
      <div className="space-y-6 p-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Current status</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const id = opening.id as OpeningId
  const criteria = getCriteria(id)
  const recommended = pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))

  return (
    <div className="space-y-6 p-8">
      {stages.length > 0 && (
        <Link
          to={`/openings/${id}/pipeline`}
          className="grid grid-cols-6 gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-palette-brand-250"
        >
          {stages.map((stage) => (
            <div key={stage.stage} className="text-center">
              <p className="text-lg font-semibold text-palette-neutral-900">{stage.count}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{stage.stage}</p>
            </div>
          ))}
        </Link>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-palette-neutral-900">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                Recommended for review
              </h2>
              <Link to={`/openings/${id}/candidates`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
                View all candidates
              </Link>
            </div>
            <div className="space-y-2">
              {recommended.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-palette-neutral-900">
                <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                Configured criteria
              </h2>
              <Link to={`/openings/${id}/criteria`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
                View all
              </Link>
            </div>
            <ul className="space-y-2">
              {criteria.map((criterion) => (
                <li key={criterion.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{criterion.name}</span>
                  <span className="text-xs text-muted-foreground">{criterion.priority}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-palette-neutral-900">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Next actions
            </h2>
            <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
