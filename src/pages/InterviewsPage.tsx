import { useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { getOpening } from '../data/openings'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import type { Candidate, OpeningId } from '../types/domain'

function Bucket({ title, description, candidates }: { title: string; description: string; candidates: Candidate[] }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-palette-neutral-900">
        {title} <span className="font-normal text-muted-foreground">({candidates.length})</span>
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No candidates here right now.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </section>
  )
}

export function InterviewsPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const pool = useEffectiveCandidatesForOpening(opening?.id as OpeningId | undefined)

  if (!opening) return null

  const interviewCandidates = pool.filter((candidate) => candidate.stage === 'Interview' && !candidate.rejected)
  const waiting = interviewCandidates.filter((candidate) => candidate.waitingOn)
  const upcoming = interviewCandidates.filter((candidate) => !candidate.waitingOn)
  const completed = pool.filter((candidate) => (candidate.stage === 'Final' || candidate.stage === 'Offer') && !candidate.rejected)

  if (interviewCandidates.length === 0 && completed.length === 0) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Current interview status</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <Bucket title="Waiting for feedback" description="In Interview, stalled on a review from you or another interviewer." candidates={waiting} />
      <Bucket title="Upcoming" description="In Interview, scheduled or ready to be scheduled." candidates={upcoming} />
      <Bucket title="Completed" description="Finished their interview and moved on to Final or Offer." candidates={completed} />
    </div>
  )
}

