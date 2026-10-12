import { Bot, Check, Clock, GitCompareArrows, Inbox, UserX, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recommendedCandidateIds } from '../../../data/candidates'
import { useState } from 'react'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { Candidate, OpeningId } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { applicantReviewSet, firstName, listJoin, supportedCount } from '../../../workspace/derive'
import { Avatar, EmptyState } from '../ui'
import { btn } from '../styles'
import { CandidateFitView } from './CandidateFitView'

function DecisionIcon({ decision, candidate }: { decision?: string; candidate: Candidate }) {
  if (candidate.rejected || decision === 'declined') return <UserX className="h-3.5 w-3.5 text-palette-neutral-500" aria-label="Declined" />
  if (decision === 'shortlisted') return <Check className="h-3.5 w-3.5 text-palette-success-600" aria-label="Shortlisted" />
  if (decision === 'deferred') return <Clock className="h-3.5 w-3.5 text-palette-warning-600" aria-label="Deferred" />
  return null
}

export function ApplicantReviewView({ task, openingId, candidateId }: { task: WorkspaceTask; openingId: OpeningId; candidateId?: string }) {
  const all = useAllEffectiveCandidates()
  const setView = useWorkspaceStore((state) => state.setView)
  const focusCandidate = useWorkspaceStore((state) => state.focusCandidate)
  const send = useWorkspaceStore((state) => state.send)
  const [selected, setSelected] = useState<string[]>([])
  const [hideAgentHint, setHideAgentHint] = useState(false)

  // Candidates stay listed after a decision (so the manager can see what they did), even once their
  // stage moves past the review stages — the set is rebuilt from the task's own decisions.
  const set = applicantReviewSet(all, openingId)
  const decidedElsewhere = Object.keys(task.decisions)
    .map((id) => all.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => !!candidate && candidate.openingId === openingId)
    .filter((candidate) => ![...set.reviewFirst, ...set.worthALook, ...set.needsInfo].some((entry) => entry.id === candidate.id))
  const groups = [
    {
      label: 'Review first',
      hint: 'Strongest evidence against the criteria',
      dot: 'bg-palette-success-500',
      count: 'bg-palette-success-150 text-palette-success-800',
      // Keep the AI's original order even after someone has been moved on.
      items: recommendedCandidateIds.map((id) => [...set.reviewFirst, ...decidedElsewhere].find((candidate) => candidate.id === id)).filter((candidate): candidate is Candidate => !!candidate),
    },
    { label: 'Worth a look', hint: 'Mixed evidence; useful alternatives', dot: 'bg-palette-info-500', count: 'bg-palette-info-150 text-palette-info-800', items: [...set.worthALook, ...decidedElsewhere.filter((candidate) => !recommendedCandidateIds.includes(candidate.id))] },
    { label: 'Needs more information', hint: 'Too little to assess either way', dot: 'bg-palette-warning-500', count: 'bg-palette-warning-150 text-palette-warning-800', items: set.needsInfo },
  ].filter((group) => group.items.length)
  const listed = groups.flatMap((group) => group.items)
  const current = listed.find((candidate) => candidate.id === candidateId) ?? listed[0]
  const untracked = Math.max(0, set.totalNew - listed.length)
  const decided = listed.filter((candidate) => task.decisions[candidate.id] || candidate.rejected).length

  if (!listed.length) {
    return <EmptyState icon={Inbox} title="No new applicants" body="Everyone with an application record has been reviewed or moved on. New applicants will appear here once screening finishes." />
  }

  const toggle = (id: string) => setSelected((list) => (list.includes(id) ? list.filter((entry) => entry !== id) : list.length >= 3 ? list : [...list, id]))

  return (
    <div className="grid gap-6 @xl:grid-cols-[240px_1fr] @4xl:grid-cols-[272px_1fr]">
      <aside className="space-y-5 @xl:sticky @xl:top-0 @xl:self-start">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-palette-neutral-650">Your progress</p>
          <p className="mt-1 text-sm text-palette-neutral-700">
            <span className="text-2xl font-semibold tabular-nums text-palette-neutral-900">{decided}</span> of {listed.length} decided
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-palette-neutral-200">
            <div className="h-full rounded-full bg-palette-success-500 transition-all" style={{ width: `${(decided / listed.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-palette-neutral-550">
            {set.totalNew} new since your last review{untracked ? ` · ${untracked} have summary data only and aren't ranked` : ''}.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', group.dot)} aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-palette-neutral-800">{group.label}</p>
              <span className={cn('ml-auto rounded-full px-1.5 text-[11px] font-semibold tabular-nums', group.count)}>{group.items.length}</span>
            </div>
            <p className="mb-2 mt-0.5 pl-4 text-[11.5px] text-palette-neutral-550">{group.hint}</p>
            <ul className="space-y-1">
              {group.items.map((candidate) => (
                <li key={candidate.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(candidate.id)}
                    onChange={() => toggle(candidate.id)}
                    aria-label={`Select ${candidate.name} to compare`}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded accent-palette-brand-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      focusCandidate(task.id, candidate.id)
                      setView(task.id, { type: 'applicant-review', openingId, candidateId: candidate.id })
                    }}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      current?.id === candidate.id ? 'border-palette-brand-300 bg-palette-brand-100 text-palette-brand-800 shadow-xs' : 'border-transparent hover:border-border hover:bg-card',
                    )}
                  >
                    <Avatar name={candidate.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm font-medium', candidate.rejected && 'line-through opacity-60')}>{candidate.name}</span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className="flex gap-0.5" aria-label={`${supportedCount(candidate)} of 5 criteria supported`}>
                          {[0, 1, 2, 3, 4].map((step) => (
                            <span key={step} className={cn('h-1.5 w-2.5 rounded-sm', step < supportedCount(candidate) ? group.dot : 'bg-palette-neutral-200')} />
                          ))}
                        </span>
                        <span className="truncate text-[11px] text-palette-neutral-550">{candidate.stage}</span>
                      </span>
                    </span>
                    <DecisionIcon decision={task.decisions[candidate.id]} candidate={candidate} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button
          type="button"
          disabled={selected.length < 2}
          onClick={() => {
            const names = selected.map((id) => all.find((candidate) => candidate.id === id)?.name ?? id)
            send(task.id, `Compare ${listJoin(names)}`)
            setSelected([])
          }}
          className={cn(btn.secondary, 'w-full')}
        >
          <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
          {selected.length >= 2 ? `Compare ${selected.length} with AI` : 'Tick 2–3 to compare'}
        </button>
      </aside>
      <div className="min-w-0">
        {decided >= 3 && !hideAgentHint && (
          // Offered only after the manager has done a few reviews themselves, never up front.
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-palette-brand-200 bg-card px-4 py-3 shadow-xs">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-palette-brand-600" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm text-palette-neutral-700">
              You've decided on {decided} applicants. The Candidate Review agent can prepare reviews like these as new applications arrive, and it still asks you before anyone moves.{' '}
              <Link to="/agents/candidate-review" className="font-medium text-palette-brand-700 hover:underline">
                See how it works
              </Link>
            </p>
            <button type="button" onClick={() => setHideAgentHint(true)} className="rounded p-0.5 text-palette-neutral-500 hover:text-palette-neutral-900" aria-label="Dismiss">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        {current && <CandidateFitView task={task} candidateId={current.id} />}
        {current && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {(() => {
              const index = listed.indexOf(current)
              const prev = listed[index - 1]
              const next = listed[index + 1]
              return (
                <>
                  <button type="button" className={btn.ghost} disabled={!prev} onClick={() => prev && setView(task.id, { type: 'applicant-review', openingId, candidateId: prev.id })}>
                    ← {prev ? firstName(prev) : 'Previous'}
                  </button>
                  <span className="text-xs text-palette-neutral-550">
                    {index + 1} of {listed.length}
                  </span>
                  <button type="button" className={btn.ghost} disabled={!next} onClick={() => next && (focusCandidate(task.id, next.id), setView(task.id, { type: 'applicant-review', openingId, candidateId: next.id }))}>
                    {next ? firstName(next) : 'Next'} →
                  </button>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
