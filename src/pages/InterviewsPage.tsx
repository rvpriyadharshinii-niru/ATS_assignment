import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getInterviewFeedback } from '../data/interviewFeedback'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import type { Candidate, OpeningId } from '../types/domain'

type QueueTab = 'needsFeedback' | 'upcoming' | 'completed'

function interviewersFor(candidate: Candidate): string {
  const reviewers = getInterviewFeedback(candidate.id).map((entry) => entry.reviewer)
  return reviewers.length > 0 ? `Priya + ${reviewers.join(' + ')}` : '—'
}

function feedbackNote(candidate: Candidate): string {
  if (candidate.waitingOn === 'priya') return 'Your feedback missing'
  if (candidate.waitingOn === 'other') return 'Waiting on interviewer'
  if (candidate.stage === 'Final' || candidate.stage === 'Offer') return 'Complete'
  return '—'
}

function actionFor(candidate: Candidate): string {
  if (candidate.waitingOn === 'priya') return 'Give feedback'
  if (candidate.waitingOn === 'other') return 'Review'
  return 'View'
}

function QueueRow({ candidate }: { candidate: Candidate }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/60">
      <td className="px-3 py-2.5 align-top">
        <Link to={`/candidates/${candidate.id}`} className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline">
          {candidate.name}
        </Link>
        {candidate.source && <p className="text-xs text-muted-foreground">Source: {candidate.source}</p>}
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">{interviewersFor(candidate)}</td>
      <td className="px-3 py-2.5 align-top text-foreground">{candidate.interviewStatus ?? candidate.stage}</td>
      <td className="px-3 py-2.5 align-top">
        <span
          className={cn(
            'text-sm font-medium',
            candidate.waitingOn === 'priya'
              ? 'text-palette-warning-700'
              : candidate.waitingOn === 'other'
                ? 'text-palette-neutral-600'
                : 'text-palette-success-700',
          )}
        >
          {feedbackNote(candidate)}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">{candidate.waitingDays !== undefined ? `${candidate.waitingDays}d` : '—'}</td>
      <td className="px-3 py-2.5 align-top">
        <Link
          to={`/candidates/${candidate.id}`}
          className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline"
        >
          {actionFor(candidate)}
        </Link>
      </td>
    </tr>
  )
}

function QueueTable({ candidates, emptyMessage }: { candidates: Candidate[]; emptyMessage: string }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-palette-brand-100/50">
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Candidate</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Interviewers</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Status</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Feedback</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Waiting</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">Action</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <QueueRow key={candidate.id} candidate={candidate} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InterviewsPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const pool = useEffectiveCandidatesForOpening(opening?.id as OpeningId | undefined)
  const [tab, setTab] = useState<QueueTab>('needsFeedback')

  if (!opening) return null

  const interviewCandidates = pool.filter((candidate) => candidate.stage === 'Interview' && !candidate.rejected)
  const needsFeedback = interviewCandidates.filter((candidate) => candidate.waitingOn)
  const upcoming = interviewCandidates.filter((candidate) => !candidate.waitingOn)
  const completed = pool.filter((candidate) => (candidate.stage === 'Final' || candidate.stage === 'Offer') && !candidate.rejected)

  if (interviewCandidates.length === 0 && completed.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Current interview status</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const TABS: { key: QueueTab; label: string; count: number }[] = [
    { key: 'needsFeedback', label: 'Needs feedback', count: needsFeedback.length },
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'completed', label: 'Completed', count: completed.length },
  ]
  const activeCandidates = tab === 'needsFeedback' ? needsFeedback : tab === 'upcoming' ? upcoming : completed
  const emptyMessage =
    tab === 'needsFeedback'
      ? 'No interviews are waiting for feedback right now.'
      : tab === 'upcoming'
        ? 'No upcoming interviews right now.'
        : 'No completed interviews yet.'

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-palette-neutral-900">Interviews</h1>
        <p className="text-sm text-muted-foreground">The interview work queue for this role.</p>
      </div>

      <div className="flex items-center gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === entry.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {entry.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                tab === entry.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-palette-neutral-200 text-palette-neutral-600',
              )}
            >
              {entry.count}
            </span>
          </button>
        ))}
      </div>

      <QueueTable candidates={activeCandidates} emptyMessage={emptyMessage} />
    </div>
  )
}
