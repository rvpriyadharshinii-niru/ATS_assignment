import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getInterviewFeedback } from '../data/interviewFeedback'
import { getOpening } from '../data/openings'
import { deriveInterviewDateTime, deriveInterviewType } from '../lib/candidateStatus'
import { cn } from '../lib/cn'
import { useEffectiveCandidatesForOpening } from '../store/candidateSelectors'
import type { Candidate, OpeningId } from '../types/domain'

type QueueTab = 'needsFeedback' | 'upcoming' | 'completed'

const OVERDUE_WAITING_DAYS = 3

function interviewerSummary(candidate: Candidate): { label: string; title: string } {
  const reviewers = getInterviewFeedback(candidate.id).map((entry) => entry.reviewer)
  const all = ['Priya', ...reviewers]
  if (reviewers.length === 0) return { label: 'Priya', title: 'Priya' }
  return { label: `Priya +${reviewers.length}`, title: all.join(', ') }
}

function statusPrimary(candidate: Candidate): string {
  if (candidate.waitingOn) return 'Awaiting feedback'
  return candidate.interviewStatus ?? candidate.stage
}

function statusSecondary(candidate: Candidate): string | undefined {
  if (candidate.waitingOn === 'priya') return 'Priya'
  if (candidate.waitingOn === 'other') {
    const other = getInterviewFeedback(candidate.id)[0]?.reviewer
    return other ?? 'Interviewer'
  }
  return undefined
}

function feedbackState(candidate: Candidate): { label: string; tone: string } {
  if (candidate.waitingOn === 'priya') return { label: 'Missing', tone: 'text-palette-warning-700' }
  if (candidate.waitingOn === 'other') return { label: 'Pending', tone: 'text-palette-neutral-600' }
  if (candidate.stage === 'Final' || candidate.stage === 'Offer') return { label: 'Complete', tone: 'text-palette-success-700' }
  return { label: '—', tone: 'text-muted-foreground' }
}

function actionFor(candidate: Candidate): string {
  if (candidate.waitingOn === 'priya') return 'Give feedback'
  if (candidate.waitingOn === 'other') return 'Review'
  return 'View'
}

function QueueRow({ candidate }: { candidate: Candidate }) {
  const interviewers = interviewerSummary(candidate)
  const feedback = feedbackState(candidate)
  const secondaryStatus = statusSecondary(candidate)
  const overdue = (candidate.waitingDays ?? 0) >= OVERDUE_WAITING_DAYS

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/60">
      <td className="whitespace-nowrap px-3 py-2.5 align-top">
        <Link to={`/candidates/${candidate.id}`} className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline">
          {candidate.name}
        </Link>
        {candidate.source && <p className="text-xs text-palette-neutral-500">{candidate.source}</p>}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top font-medium text-foreground">{deriveInterviewType(candidate)}</td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top text-muted-foreground" title={interviewers.title}>
        {interviewers.label}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top text-muted-foreground">{deriveInterviewDateTime(candidate)}</td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top">
        <p className="text-foreground">{statusPrimary(candidate)}</p>
        {secondaryStatus && <p className="text-xs text-palette-neutral-500">{secondaryStatus}</p>}
      </td>
      <td className={cn('whitespace-nowrap px-3 py-2.5 align-top text-sm font-medium', feedback.tone)}>{feedback.label}</td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top">
        {candidate.waitingDays !== undefined ? (
          <span className={overdue ? 'font-semibold text-palette-warning-700' : 'text-muted-foreground'}>{candidate.waitingDays}d</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 align-top">
        <Link
          to={`/candidates/${candidate.id}`}
          className="whitespace-nowrap text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline"
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
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-palette-neutral-200">
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Candidate</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Interview</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Interviewers</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Date &amp; time</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Status</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Feedback</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Waiting</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">Action</th>
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
  const [searchQuery, setSearchQuery] = useState('')

  if (!opening) return null

  const query = searchQuery.trim().toLowerCase()
  const matchesSearch = (candidate: Candidate) => query.length === 0 || candidate.name.toLowerCase().includes(query)

  const allInterviewCandidates = pool.filter((candidate) => candidate.stage === 'Interview' && !candidate.rejected)
  const allCompleted = pool.filter((candidate) => (candidate.stage === 'Final' || candidate.stage === 'Offer') && !candidate.rejected)

  if (allInterviewCandidates.length === 0 && allCompleted.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Current interview status</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const interviewCandidates = allInterviewCandidates.filter(matchesSearch)
  const needsFeedback = interviewCandidates.filter((candidate) => candidate.waitingOn)
  const upcoming = interviewCandidates.filter((candidate) => !candidate.waitingOn)
  const completed = allCompleted.filter(matchesSearch)

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-palette-neutral-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search interviews…"
            aria-label="Search interviews"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
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
