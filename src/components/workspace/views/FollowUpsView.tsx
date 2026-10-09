import { CheckCircle2, Mail, MessageSquare, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { getCandidate } from '../../../data/candidates'
import { getFeedbackRecords } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { FollowUpDraft, WorkspaceTask } from '../../../types/workspace'
import { criterionName, firstName, gapCriteria, waitingOnFeedback } from '../../../workspace/derive'
import { EmptyState, Label } from '../ui'
import { btn, inputBase } from '../styles'

export function DraftCard({ task, draft, onApprove, onSkip }: { task: WorkspaceTask; draft: FollowUpDraft; onApprove?: () => void; onSkip?: () => void }) {
  const updateDraft = useWorkspaceStore((state) => state.updateDraft)
  const reviseDraft = useWorkspaceStore((state) => state.reviseDraft)
  const approveDraft = useWorkspaceStore((state) => state.approveDraft)
  const skipDraft = useWorkspaceStore((state) => state.skipDraft)
  const candidate = getCandidate(draft.candidateId)
  const locked = draft.status !== 'draft'
  return (
    <div className={cn('rounded-xl border bg-card p-4', locked ? 'border-border opacity-90' : 'border-palette-warning-300')}>
      <div className="flex flex-wrap items-start gap-2">
        {draft.audience === 'Candidate' ? <Mail className="mt-0.5 h-4 w-4 text-palette-neutral-500" aria-hidden="true" /> : <MessageSquare className="mt-0.5 h-4 w-4 text-palette-neutral-500" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-palette-neutral-900">
            To: {draft.recipient} <span className="font-normal text-palette-neutral-550">· about {candidate?.name}</span>
          </p>
          <p className="text-xs text-palette-neutral-550">
            {draft.channel} · {draft.audience === 'Candidate' ? 'external, goes to the candidate' : 'internal'}
          </p>
        </div>
        {draft.status === 'approved' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-palette-success-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Approved · recorded
          </span>
        )}
        {draft.status === 'skipped' && <span className="text-xs font-semibold text-palette-neutral-500">Skipped</span>}
      </div>
      <p className="mt-2 text-xs text-palette-neutral-600">Why: {draft.reason}</p>
      <label className="mt-3 block">
        <Label>Subject</Label>
        <input value={draft.subject} disabled={locked} onChange={(event) => updateDraft(task.id, draft.id, { subject: event.target.value })} className={cn(inputBase, 'mt-1')} />
      </label>
      <label className="mt-2 block">
        <Label>Message</Label>
        <textarea value={draft.body} disabled={locked} rows={7} onChange={(event) => updateDraft(task.id, draft.id, { body: event.target.value })} className={cn(inputBase, 'mt-1 resize-y text-[13px] leading-relaxed')} />
      </label>
      {!locked && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={btn.primary} onClick={onApprove ?? (() => approveDraft(task.id, draft.id))}>
            Approve and record
          </button>
          <button type="button" className={btn.secondary} onClick={onSkip ?? (() => skipDraft(task.id, draft.id))}>
            Skip
          </button>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-palette-neutral-550">
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            Ask AI to revise:
          </span>
          {(['shorter', 'friendlier', 'firmer'] as const).map((style) => (
            <button key={style} type="button" className={btn.chip} onClick={() => reviseDraft(task.id, draft.id, style)}>
              {style === 'shorter' ? 'Shorter' : style === 'friendlier' ? 'Warmer' : 'Firmer'}
            </button>
          ))}
        </div>
      )}
      {!locked && <p className="mt-2 text-[11px] text-palette-neutral-500">Approving records the message in HireFlow and on the pipeline. No email or chat message is actually delivered in this prototype.</p>}
    </div>
  )
}

const RECOMMENDATIONS = ['Advance to Final', 'Needs another conversation', 'Do not advance']

export function OwnFeedbackForm({ candidateId, onSubmit, submitted }: { candidateId: string; onSubmit: (recommendation: string, notes: string) => void; submitted?: boolean }) {
  const candidate = getCandidate(candidateId)
  const [recommendation, setRecommendation] = useState('')
  const [notes, setNotes] = useState('')
  if (!candidate) return null
  const records = getFeedbackRecords(candidateId)
  const gaps = gapCriteria(candidate)
  if (submitted) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-lg bg-palette-success-150 px-3 py-2 text-sm font-medium text-palette-success-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Your feedback for {candidate.name} is submitted.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {records.length > 0 && (
        <div className="rounded-lg border border-border bg-palette-neutral-100 p-3">
          <Label>Panel notes already recorded (written by interviewers)</Label>
          <ul className="mt-1.5 space-y-1.5">
            {records.map((record) => (
              <li key={record.id} className="text-xs text-palette-neutral-700">
                <span className="font-semibold">{record.reviewer}</span> · {record.overall}: “{record.points[0]?.text}”
              </li>
            ))}
          </ul>
        </div>
      )}
      {gaps.length > 0 && (
        <div className="rounded-lg border border-dashed border-palette-brand-250 p-3">
          <Label>Prepared by AI · points you may want to cover</Label>
          <p className="mt-1 text-xs text-palette-neutral-700">
            Evidence is still thin on {gaps.map((gap) => criterionName(candidate, gap.key).toLowerCase()).join(' and ')}. This is a prompt for your own notes, not feedback.
          </p>
        </div>
      )}
      <fieldset>
        <legend className="text-xs font-semibold text-palette-neutral-700">Your recommendation</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {RECOMMENDATIONS.map((option) => (
            <label key={option} className={cn('cursor-pointer rounded-lg border px-3 py-1.5 text-sm', recommendation === option ? 'border-primary bg-palette-brand-100 text-palette-brand-800' : 'border-border hover:bg-muted')}>
              <input type="radio" name={`rec-${candidateId}`} value={option} checked={recommendation === option} onChange={() => setRecommendation(option)} className="sr-only" />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="text-xs font-semibold text-palette-neutral-700">Your notes</span>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={cn(inputBase, 'mt-1')} placeholder={`What did you observe in ${firstName(candidate)}'s interview?`} />
      </label>
      <button type="button" className={btn.primary} disabled={!recommendation || !notes.trim()} onClick={() => onSubmit(recommendation, notes)}>
        Submit my feedback
      </button>
    </div>
  )
}

export function FollowUpsView({ task }: { task: WorkspaceTask }) {
  const all = useAllEffectiveCandidates()
  const submitOwnFeedback = useWorkspaceStore((state) => state.submitOwnFeedback)
  const own = waitingOnFeedback(all).filter((candidate) => candidate.waitingOn === 'priya')
  const submittedOwn = all.filter((candidate) => candidate.interviewStatus?.startsWith('Your feedback submitted'))
  const approved = task.drafts.filter((draft) => draft.status !== 'draft').length

  if (!own.length && !task.drafts.length && !submittedOwn.length) {
    return <EmptyState icon={MessageSquare} title="No follow-ups needed" body="Nobody is waiting on interview feedback right now." />
  }
  return (
    <div className="space-y-5">
      <p className="text-sm text-palette-neutral-700">
        {approved} of {task.drafts.length} reminders handled{own.length ? ` · your own feedback is still pending for ${own.map(firstName).join(', ')}` : ''}.
      </p>
      {(own.length > 0 || submittedOwn.length > 0) && (
        <section className="space-y-3">
          <Label>Your own feedback</Label>
          {[...own, ...submittedOwn].map((candidate) => (
            <div key={candidate.id} className="rounded-xl border border-palette-warning-300 bg-card p-4">
              <p className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</p>
              <p className="mb-3 text-xs text-palette-neutral-600">{candidate.waitingDays ? `Waiting on you for ${candidate.waitingDays} days. Nothing else is blocking the next step.` : 'Submitted.'}</p>
              <OwnFeedbackForm candidateId={candidate.id} submitted={!candidate.waitingOn} onSubmit={(recommendation, notes) => submitOwnFeedback(task.id, candidate.id, recommendation, notes)} />
            </div>
          ))}
        </section>
      )}
      {task.drafts.length > 0 && (
        <section className="space-y-3">
          <Label>Reminders to interviewers</Label>
          {task.drafts.map((draft) => (
            <DraftCard key={draft.id} task={task} draft={draft} />
          ))}
        </section>
      )}
    </div>
  )
}
