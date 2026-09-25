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
      className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3.5 transition-all hover:border-palette-neutral-300 hover:bg-muted hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="truncate text-[15px] font-semibold text-palette-neutral-900">{candidate.name}</h3>
          <RecommendationBadge label={candidate.recommendation} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{metaParts.join(' · ')}</p>
        <p className="font-sans mt-1.5 text-sm text-foreground">
          {candidate.prioritiesSupported !== undefined ? (
            <span className="font-display font-medium text-palette-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
          ) : (
            candidate.notableGap
          )}
          {candidate.screeningScore !== undefined && (
            <span className="font-mono text-[11px] text-palette-neutral-400"> · AI Screening Score: {candidate.screeningScore}</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
          {candidate.stage}
        </span>
        <ChevronRight className="h-4 w-4 text-palette-neutral-300 transition-colors group-hover:text-palette-neutral-500" aria-hidden="true" />
      </div>
    </Link>
  )
}
