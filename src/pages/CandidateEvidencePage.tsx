import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CriterionEvidenceList } from '../components/candidates/CriterionEvidence'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { getCandidate } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { isUncertainStrength } from '../lib/evidence'
import { useAppStore } from '../store/useAppStore'

export function CandidateEvidencePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const candidate = getCandidate(candidateId)
  const setSelectedCandidate = useAppStore((state) => state.setSelectedCandidate)

  useEffect(() => {
    if (candidate) setSelectedCandidate(candidate.id, candidate.openingId)
  }, [candidate, setSelectedCandidate])

  if (!candidate) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">This candidate record is not available in the prototype.</p>
        </div>
      </div>
    )
  }

  const opening = getOpening(candidate.openingId)
  const criteria = getCriteria(candidate.openingId)
  const hasUncertainty = candidate.evidence.some((evidence) => isUncertainStrength(evidence.strength))

  return (
    <div className="space-y-6 p-8">
      <Link
        to={`/openings/${candidate.openingId}/candidates`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {opening?.title ?? 'Candidates'}
      </Link>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{candidate.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {candidate.currentRole && `${candidate.currentRole} · ${candidate.currentCompany} · `}
              {candidate.experienceYears} yrs experience · {candidate.location}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <RecommendationBadge label={candidate.recommendation} />
          {candidate.prioritiesSupported !== undefined && (
            <span className="text-sm font-medium text-palette-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
          )}
          {candidate.screeningScore !== undefined && (
            <span className="text-sm text-palette-neutral-400">AI Screening Score: {candidate.screeningScore}</span>
          )}
        </div>

        {candidate.summary && <p className="mt-3 text-sm leading-relaxed text-foreground">{candidate.summary}</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Criteria &amp; evidence</h2>
        <div className="mt-3">
          <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} />
        </div>
        {hasUncertainty && (
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Criteria marked <span className="font-medium text-palette-warning-700">Unclear</span> or{' '}
            <span className="font-medium text-palette-warning-700">Not available</span> reflect missing information, not a negative finding.
          </p>
        )}
      </div>
    </div>
  )
}
