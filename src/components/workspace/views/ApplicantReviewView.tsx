import { Check, Clock, GitCompareArrows, Inbox, UserX } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { Candidate, OpeningId } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { applicantReviewSet, firstName, listJoin, supportedCount } from '../../../workspace/derive'
import { EmptyState, Label } from '../ui'
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

  // Candidates stay listed after a decision (so the manager can see what they did), even once their
  // stage moves past the review stages — the set is rebuilt from the task's own decisions.
  const set = applicantReviewSet(all, openingId)
  const decidedElsewhere = Object.keys(task.decisions)
    .map((id) => all.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => !!candidate && candidate.openingId === openingId)
    .filter((candidate) => ![...set.reviewFirst, ...set.worthALook, ...set.needsInfo].some((entry) => entry.id === candidate.id))
  const groups = [
    { label: 'Review first', hint: 'Strongest evidence against the criteria', items: [...set.reviewFirst, ...decidedElsewhere.filter((candidate) => ['ananya-rao', 'rahul-mehta', 'meera-shah'].includes(candidate.id))] },
    { label: 'Worth a look', hint: 'Mixed evidence; useful alternatives', items: [...set.worthALook, ...decidedElsewhere.filter((candidate) => !['ananya-rao', 'rahul-mehta', 'meera-shah'].includes(candidate.id))] },
    { label: 'Needs more information', hint: 'Too little to assess either way', items: set.needsInfo },
  ].filter((group) => group.items.length)
  const listed = groups.flatMap((group) => group.items)
  const current = listed.find((candidate) => candidate.id === candidateId) ?? listed[0]
  const decided = listed.filter((candidate) => task.decisions[candidate.id] || candidate.rejected).length

  if (!listed.length) {
    return <EmptyState icon={Inbox} title="No new applicants" body="Everyone with an application record has been reviewed or moved on. New applicants will appear here once screening finishes." />
  }

  const toggle = (id: string) => setSelected((list) => (list.includes(id) ? list.filter((entry) => entry !== id) : list.length >= 3 ? list : [...list, id]))

  return (
    <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-semibold text-palette-neutral-900">
            {decided} of {listed.length} decided
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-palette-neutral-200">
            <div className="h-full rounded-full bg-palette-success-500 transition-all" style={{ width: `${(decided / listed.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-palette-neutral-550">
            {set.totalNew} new since your last review{set.untrackedNew ? ` · ${set.untrackedNew} have summary data only and aren't ranked` : ''}.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.label}>
            <Label>{group.label}</Label>
            <p className="mb-1.5 text-[11px] text-palette-neutral-500">{group.hint}</p>
            <ul className="space-y-1">
              {group.items.map((candidate) => (
                <li key={candidate.id} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(candidate.id)}
                    onChange={() => toggle(candidate.id)}
                    aria-label={`Select ${candidate.name} to compare`}
                    className="h-3.5 w-3.5 shrink-0 accent-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      focusCandidate(task.id, candidate.id)
                      setView(task.id, { type: 'applicant-review', openingId, candidateId: candidate.id })
                    }}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      current?.id === candidate.id ? 'bg-palette-brand-100 text-palette-brand-800' : 'hover:bg-muted',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm font-medium', candidate.rejected && 'line-through opacity-60')}>{candidate.name}</span>
                      <span className="block truncate text-[11px] text-palette-neutral-550">
                        {supportedCount(candidate)}/5 supported · {candidate.stage}
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
