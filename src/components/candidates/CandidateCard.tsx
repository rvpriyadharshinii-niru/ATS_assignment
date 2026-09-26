import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildStatusNote } from '../../lib/candidateStatus'
import { cn } from '../../lib/cn'
import type { Candidate } from '../../types/domain'
import { CandidateActionsMenu } from './CandidateActionsMenu'
import { RecommendationBadge } from './RecommendationBadge'

function StatusTags({ candidate }: { candidate: Candidate }) {
  if (!candidate.hold && !candidate.rejected && !candidate.selected) return null
  return (
    <>
      {candidate.hold && (
        <span className="shrink-0 rounded-full bg-palette-warning-150 px-2 py-0.5 text-[11px] font-medium text-palette-warning-700">On hold</span>
      )}
      {candidate.rejected && (
        <span className="shrink-0 rounded-full bg-palette-neutral-150 px-2 py-0.5 text-[11px] font-medium text-palette-neutral-500">Rejected</span>
      )}
      {candidate.selected && (
        <span className="shrink-0 rounded-full bg-palette-success-150 px-2 py-0.5 text-[11px] font-medium text-palette-success-700">Selected</span>
      )}
    </>
  )
}

interface CandidateCardProps {
  candidate: Candidate
  /** `board` renders a condensed vertical card suited to a narrow Kanban column. */
  variant?: 'row' | 'board'
  /** Board only — an active filter/highlight (e.g. from Copilot) matches this candidate. */
  highlighted?: boolean
  /** Board only — an active filter/highlight is set and this candidate does NOT match it. */
  dimmed?: boolean
}

export function CandidateCard({ candidate, variant = 'row', highlighted = false, dimmed = false }: CandidateCardProps) {
  const statusNote = buildStatusNote(candidate)

  if (variant === 'board') {
    const feedbackNeeded = candidate.waitingOn === 'priya'
    const metaParts = [
      candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs` : undefined,
      candidate.location,
    ].filter((part): part is string => Boolean(part))
    return (
      <div
        className={cn(
          'flex gap-2 rounded-lg border bg-card shadow-xs transition-shadow hover:shadow-sm',
          highlighted ? 'border-palette-brand-350 ring-1 ring-palette-brand-300' : 'border-border',
          candidate.rejected && 'opacity-60',
          dimmed && 'opacity-40',
        )}
      >
        <span className={cn('w-[3px] shrink-0 rounded-l-lg', feedbackNeeded ? 'bg-palette-warning-450' : 'bg-transparent')} aria-hidden="true" />
        <div className="min-w-0 flex-1 py-2.5 pr-3">
          <div className="flex items-start justify-between gap-1">
            <Link
              to={`/candidates/${candidate.id}`}
              className="truncate text-sm font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline"
            >
              {candidate.name}
            </Link>
            <CandidateActionsMenu candidate={candidate} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
            {candidate.prioritiesSupported !== undefined && <span>{candidate.prioritiesSupported}/5</span>}
            <StatusTags candidate={candidate} />
          </div>
          <p className="mt-1 truncate text-xs text-palette-neutral-500">
            {[...metaParts, candidate.updatedLabel ? `${candidate.updatedLabel} in stage` : undefined].filter(Boolean).join(' · ')}
          </p>
          {feedbackNeeded ? (
            <span className="mt-1.5 inline-flex items-center rounded-full bg-palette-warning-150 px-2 py-0.5 text-[11px] font-semibold text-palette-warning-700">
              Feedback needed
            </span>
          ) : (
            statusNote && <p className="mt-1 text-xs font-medium text-palette-warning-700">{statusNote}</p>
          )}
        </div>
      </div>
    )
  }

  const metaParts = [
    candidate.currentRole && candidate.currentCompany ? `${candidate.currentRole} · ${candidate.currentCompany}` : null,
    candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs experience` : null,
    candidate.location,
  ].filter((part): part is string => Boolean(part))

  return (
    <Link
      to={`/candidates/${candidate.id}`}
      className={cn(
        'group flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3.5 transition-all hover:border-palette-neutral-300 hover:bg-muted hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        candidate.rejected && 'opacity-60',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="truncate text-[15px] font-semibold text-palette-neutral-900">{candidate.name}</h3>
          {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
          <StatusTags candidate={candidate} />
        </div>
        {metaParts.length > 0 && <p className="mt-1 truncate text-sm text-muted-foreground">{metaParts.join(' · ')}</p>}
        {(candidate.prioritiesSupported !== undefined || candidate.notableGap || candidate.screeningScore !== undefined) && (
          <p className="mt-1.5 text-sm text-foreground">
            {candidate.prioritiesSupported !== undefined ? (
              <span className="font-medium text-palette-neutral-700">{candidate.prioritiesSupported} / 5 priorities supported</span>
            ) : (
              candidate.notableGap
            )}
            {candidate.screeningScore !== undefined && <span className="text-palette-neutral-500"> · AI Screening Score: {candidate.screeningScore}</span>}
          </p>
        )}
        {statusNote && <p className="mt-1.5 text-sm font-medium text-palette-warning-700">{statusNote}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
        <ChevronRight className="h-4 w-4 text-palette-neutral-300 transition-colors group-hover:text-palette-neutral-500" aria-hidden="true" />
      </div>
    </Link>
  )
}
