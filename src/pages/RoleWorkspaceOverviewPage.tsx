import { Link, useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { getCandidatesForOpening, recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { getPipelineStages } from '../data/pipeline'
import type { OpeningId } from '../types/domain'

export function RoleWorkspaceOverviewPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
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
  const recommended = getCandidatesForOpening(id).filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  const stages = getPipelineStages(id)

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      <div className="col-span-2 space-y-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Recommended for review</h2>
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

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Pipeline summary</h2>
            <Link to={`/openings/${id}/pipeline`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
              Open pipeline
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between text-sm">
              {stages.map((stage) => (
                <div key={stage.stage} className="text-center">
                  <p className="text-lg font-semibold text-palette-neutral-900">{stage.count}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stage.stage}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-palette-neutral-900">Configured criteria</h2>
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
          <h2 className="text-sm font-semibold text-palette-neutral-900">Next actions</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </section>
      </div>
    </div>
  )
}
