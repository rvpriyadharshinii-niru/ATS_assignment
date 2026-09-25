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
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">This candidate record is not available in the prototype.</p>
      </div>
    )
  }

  const opening = getOpening(candidate.openingId)
  const criteria = getCriteria(candidate.openingId)
  const hasUncertainty = candidate.evidence.some((evidence) => isUncertainStrength(evidence.strength))

  return (
    <div className="space-y-6">
      <Link
        to={`/openings/${candidate.openingId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {opening?.title ?? 'Candidates'}
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{candidate.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {candidate.currentRole && `${candidate.currentRole} · ${candidate.currentCompany} · `}
              {candidate.experienceYears} yrs experience · {candidate.location}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">{candidate.stage}</span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <RecommendationBadge label={candidate.recommendation} />
          {candidate.prioritiesSupported !== undefined && (
            <span className="text-sm font-medium text-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
          )}
          {candidate.screeningScore !== undefined && (
            <span className="text-sm text-neutral-400">AI Screening Score: {candidate.screeningScore}</span>
          )}
        </div>

        {candidate.summary && <p className="mt-3 text-sm leading-relaxed text-neutral-600">{candidate.summary}</p>}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Criteria &amp; evidence</h2>
          <p className="text-xs text-neutral-400">Sourced from resume, application and screening information</p>
        </div>
        <div className="mt-2">
          <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} />
        </div>
        {hasUncertainty && (
          <p className="mt-3 text-xs text-neutral-500">
            Criteria marked <span className="font-medium text-amber-700">Unclear</span> or{' '}
            <span className="font-medium text-amber-700">Not available</span> reflect missing information, not a negative finding.
          </p>
        )}
      </div>
    </div>
  )
}
