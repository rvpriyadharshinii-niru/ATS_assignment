import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Candidate } from '../../types/domain'
import { RecommendationBadge } from './RecommendationBadge'

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const metaParts = [
    candidate.currentRole && candidate.currentCompany ? `${candidate.currentRole} · ${candidate.currentCompany}` : null,
    `${candidate.experienceYears} yrs experience`,
    candidate.location,
  ].filter((part): part is string => Boolean(part))

  return (
    <Link
      to={`/candidates/${candidate.id}`}
      className="group flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-3.5 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="truncate text-[15px] font-semibold text-neutral-900">{candidate.name}</h3>
          <RecommendationBadge label={candidate.recommendation} />
        </div>
        <p className="mt-1 truncate text-sm text-neutral-500">{metaParts.join(' · ')}</p>
        <p className="mt-1.5 text-sm text-neutral-600">
          {candidate.prioritiesSupported !== undefined ? (
            <span className="font-medium text-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
          ) : (
            candidate.notableGap
          )}
          {candidate.screeningScore !== undefined && (
            <span className="text-neutral-400"> · AI Screening Score: {candidate.screeningScore}</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">{candidate.stage}</span>
        <ChevronRight className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-neutral-500" aria-hidden="true" />
      </div>
    </Link>
  )
}
