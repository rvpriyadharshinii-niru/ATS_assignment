import { AlertCircle, ArrowRight, Clock, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PENDING_SCORECARDS } from '../../../data/sources'
import { buildStatusNote } from '../../../lib/candidateStatus'
import { cn } from '../../../lib/cn'
import { advanceConsequences, STAGE_ORDER } from '../../../lib/stage'
import { STAGE_BAR_FILL } from '../../../lib/stageTone'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAppStore } from '../../../store/useAppStore'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { Candidate, CandidateStage, OpeningId } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { daysSinceUpdate, delayDiagnosis, FEEDBACK_TARGET_DAYS, pipelineIssues, stageCounts } from '../../../workspace/derive'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { Label } from '../ui'
import { btn } from '../styles'

const SEVERITY_DOT = { high: 'bg-palette-danger-500', medium: 'bg-palette-warning-450', low: 'bg-palette-neutral-400' }

function ManualMove({ candidate }: { candidate: Candidate }) {
  const advanceCandidates = useAppStore((state) => state.advanceCandidates)
  const pushToast = useAppStore((state) => state.pushToast)
  const undo = useAppStore((state) => state.undoLastMutation)
  const [target, setTarget] = useState<CandidateStage | null>(null)
  return (
    <>
      <select
        value=""
        aria-label={`Move ${candidate.name} to another stage`}
        onChange={(event) => setTarget(event.target.value as CandidateStage)}
        className="rounded-md border border-border bg-card px-1.5 py-1 text-xs text-palette-neutral-700"
      >
        <option value="">Move to…</option>
        {STAGE_ORDER.filter((stage) => stage !== candidate.stage).map((stage) => (
          <option key={stage}>{stage}</option>
        ))}
      </select>
      {target && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setTarget(null)}
          title={`Move ${candidate.name} to ${target}?`}
          lines={[`${candidate.stage} → ${target}`]}
          consequences={advanceConsequences(target)}
          confirmLabel={`Move to ${target}`}
          onConfirm={() => {
            advanceCandidates([candidate.id], target)
            pushToast(`${candidate.name} moved to ${target}.`, { actionLabel: 'Undo', onAction: undo })
            setTarget(null)
          }}
        />
      )}
    </>
  )
}

export function PipelineView({ task, openingId, focus, stage }: { task: WorkspaceTask; openingId: OpeningId; focus?: 'delay'; stage?: CandidateStage }) {
  const all = useAllEffectiveCandidates()
  const send = useWorkspaceStore((state) => state.send)
  const setView = useWorkspaceStore((state) => state.setView)
  const counts = stageCounts(all, openingId)
  const issues = pipelineIssues(all, openingId)
  const total = counts.reduce((sum, entry) => sum + entry.count, 0)
  const selectedStage = stage ?? (focus === 'delay' ? 'Interview' : undefined)
  const selected = counts.find((entry) => entry.stage === selectedStage)
  const diagnosis = focus === 'delay' ? delayDiagnosis(all, openingId) : undefined

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <Label>Senior Product Designer · {total} active</Label>
          <Link to={`/openings/${openingId}/pipeline`} className="inline-flex items-center gap-1 text-xs font-medium text-palette-neutral-600 hover:text-palette-brand-700">
            Open pipeline board
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 @xl:grid-cols-6">
          {counts.map((entry) => {
            const flagged = issues.some((issue) => issue.stage === entry.stage)
            return (
              <button
                key={entry.stage}
                type="button"
                onClick={() => setView(task.id, { type: 'pipeline', openingId, focus, stage: entry.stage === selectedStage ? undefined : entry.stage })}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  entry.stage === selectedStage ? 'border-palette-brand-400 bg-palette-brand-100' : 'border-border hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-palette-neutral-600">
                  <span className={cn('h-2 w-2 rounded-full', STAGE_BAR_FILL[entry.stage])} aria-hidden="true" />
                  {entry.stage}
                  {flagged && <AlertCircle className="ml-auto h-3 w-3 text-palette-warning-600" aria-label="Needs attention" />}
                </span>
                <span className="mt-0.5 block text-lg font-semibold text-palette-neutral-900">{entry.count}</span>
                <span className="block text-[10.5px] text-palette-neutral-500">{entry.named.length} with records</span>
              </button>
            )
          })}
        </div>
      </section>

      {diagnosis && (
        <section className="rounded-xl border border-palette-warning-400 bg-palette-warning-100 p-4">
          <p className="text-sm font-semibold text-palette-neutral-900">{diagnosis.headline}</p>
          <ul className="mt-2 space-y-1">
            {diagnosis.points.map((point) => (
              <li key={point} className="text-sm text-palette-neutral-800">
                · {point}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-palette-neutral-600">Based on stage, waiting days and pending scorecards in HireFlow. Target: feedback within {FEEDBACK_TARGET_DAYS} business days.</p>
          {diagnosis.candidateIds.length > 0 && (
            <button type="button" className={cn(btn.primary, 'mt-3')} onClick={() => send(task.id, 'Prepare follow-ups for everyone waiting on feedback')}>
              Prepare follow-ups for everyone waiting
            </button>
          )}
        </section>
      )}

      {selected && (
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-palette-neutral-900">
              {selected.stage} · {selected.named.length} with records
            </p>
            {selected.count > selected.named.length && <p className="text-xs text-palette-neutral-550">{selected.count - selected.named.length} more are summary-only in this prototype</p>}
          </div>
          {selected.named.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">No candidates with records in this stage.</p>
          ) : (
            <ul>
              {selected.named.map((candidate) => {
                const pending = PENDING_SCORECARDS[candidate.id]
                return (
                  <li key={candidate.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => send(task.id, `Why ${candidate.name}?`)} className="text-sm font-medium text-palette-neutral-900 hover:text-palette-brand-700">
                        {candidate.name}
                      </button>
                      <p className="text-xs text-palette-neutral-600">
                        {buildStatusNote(candidate) ?? `In stage ${daysSinceUpdate(candidate) || '<1'}d`}
                        {candidate.waitingOn === 'other' && pending ? ` · ${pending.reviewer}` : ''}
                      </p>
                    </div>
                    {candidate.waitingDays !== undefined && (
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', candidate.waitingDays > FEEDBACK_TARGET_DAYS ? 'text-palette-danger-600' : 'text-palette-neutral-600')}>
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {candidate.waitingDays}d
                      </span>
                    )}
                    <ManualMove candidate={candidate} />
                    <Link to={`/candidates/${candidate.id}`} className="text-xs font-medium text-palette-neutral-600 hover:text-palette-brand-700">
                      Profile
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <section>
        <Label className="mb-2">What needs attention</Label>
        {issues.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">Nothing needs attention. All stages are moving within target.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li key={issue.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_DOT[issue.severity])} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-palette-neutral-900">{issue.title}</p>
                    <p className="mt-0.5 text-sm text-palette-neutral-700">{issue.why}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {issue.candidateIds.map((id) => {
                        const candidate = all.find((entry) => entry.id === id)
                        return (
                          <button key={id} type="button" onClick={() => setView(task.id, { type: 'pipeline', openingId, focus, stage: issue.stage })} className="rounded-md bg-palette-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-palette-neutral-700 hover:bg-palette-neutral-250">
                            {candidate?.name}
                          </button>
                        )
                      })}
                    </div>
                    {issue.prepared && <p className="mt-2 text-xs text-palette-brand-700">Prepared: {issue.prepared}</p>}
                  </div>
                  {issue.action && (
                    <button type="button" className={btn.secondary} onClick={() => send(task.id, issue.action!.query)}>
                      {issue.action.label}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
