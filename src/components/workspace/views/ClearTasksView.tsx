import { Bot, CheckCircle2, Circle, CircleSlash, Clock, ExternalLink, FileX, Home, ListChecks, SkipForward } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AGENT_DEFINITIONS } from '../../../data/agents'
import { getCandidate } from '../../../data/candidates'
import { getCriteria } from '../../../data/criteria'
import { cn } from '../../../lib/cn'
import { advanceConsequences } from '../../../lib/stage'
import { useAgentStore } from '../../../store/useAgentStore'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { SessionItem, WorkspaceTask } from '../../../types/workspace'
import { evidenceFor, firstName } from '../../../workspace/derive'
import { DraftCard, OwnFeedbackForm } from './FollowUpsView'
import { InterviewGuideEditor } from './InterviewGuideEditor'
import { Label, StrengthPill } from '../ui'
import { btn } from '../styles'

const KIND_LABEL: Record<SessionItem['kind'], string> = {
  shortlist: 'Applicant review',
  'agent-proposal': 'Agent proposal',
  'own-feedback': 'Your feedback',
  reminder: 'Follow-up',
  guide: 'Interview prep',
  decision: 'Decision',
}

function StatusIcon({ status }: { status: SessionItem['status'] }) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-palette-success-600" aria-label="Done" />
  if (status === 'skipped') return <SkipForward className="h-4 w-4 text-palette-neutral-450" aria-label="Skipped" />
  if (status === 'deferred') return <Clock className="h-4 w-4 text-palette-warning-600" aria-label="Deferred" />
  if (status === 'blocked') return <CircleSlash className="h-4 w-4 text-palette-danger-500" aria-label="Couldn't complete" />
  return <Circle className="h-4 w-4 text-palette-neutral-400" aria-label="To do" />
}

function SecondaryActions({ task, item, allowDecline }: { task: WorkspaceTask; item: SessionItem; allowDecline?: boolean }) {
  const resolve = useWorkspaceStore((state) => state.sessionResolve)
  return (
    <>
      {allowDecline && (
        <button type="button" className={btn.secondary} onClick={() => resolve(task.id, item.id, 'decline')}>
          Decline
        </button>
      )}
      <button type="button" className={btn.ghost} onClick={() => resolve(task.id, item.id, 'defer')}>
        Defer
      </button>
      <button type="button" className={btn.ghost} onClick={() => resolve(task.id, item.id, 'skip')}>
        Skip
      </button>
    </>
  )
}

function ItemBody({ task, item }: { task: WorkspaceTask; item: SessionItem }) {
  const resolve = useWorkspaceStore((state) => state.sessionResolve)
  const send = useWorkspaceStore((state) => state.send)
  const setView = useWorkspaceStore((state) => state.setView)
  const activity = useAgentStore((state) => state.activity)
  const candidate = getCandidate(item.candidateId)
  if (!candidate) return null
  const open = item.status === 'todo'

  if (item.kind === 'shortlist') {
    const criteria = getCriteria(candidate.openingId)
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg border border-border">
          {criteria.map((criterion, index) => {
            const evidence = evidenceFor(candidate, criterion.key)
            return (
              <div key={criterion.key} className={cn('flex items-start gap-3 px-3 py-2', index > 0 && 'border-t border-border')}>
                <span className="w-40 shrink-0 text-xs font-medium text-palette-neutral-800">{criterion.name}</span>
                <StrengthPill strength={evidence?.strength ?? 'Not available'} />
                <span className="min-w-0 flex-1 text-xs text-palette-neutral-600">{evidence?.detail}</span>
              </div>
            )
          })}
        </div>
        {open && (
          <>
            <div className="rounded-lg bg-palette-neutral-100 p-3 text-xs text-palette-neutral-700">
              <span className="font-semibold">Approving will:</span> {advanceConsequences(item.toStage ?? 'Interview').join(' · ')}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.primary} onClick={() => resolve(task.id, item.id, 'approve')}>
                Approve: move to {item.toStage}
              </button>
              <button type="button" className={btn.secondary} onClick={() => setView(task.id, { type: 'candidate', candidateId: candidate.id })}>
                Inspect evidence
              </button>
              <button type="button" className={btn.secondary} onClick={() => send(task.id, `What are the gaps for ${firstName(candidate)}?`)}>
                Ask AI about gaps
              </button>
              <SecondaryActions task={task} item={item} />
            </div>
          </>
        )}
      </div>
    )
  }

  if (item.kind === 'agent-proposal') {
    const entry = activity.find((activityItem) => activityItem.id === item.agentActivityId)
    const approval = entry?.approval
    return (
      <div className="space-y-3">
        {entry && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-palette-neutral-600">
            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            {AGENT_DEFINITIONS[entry.agentId].name} · {entry.approvalReason}
          </p>
        )}
        {entry?.evidence && (
          <ul className="space-y-0.5 rounded-lg border border-border px-3 py-2">
            {entry.evidence.map((line) => (
              <li key={line} className="text-xs text-palette-neutral-700">
                · {line}
              </li>
            ))}
          </ul>
        )}
        {approval?.kind === 'email' && (
          <div className="rounded-lg border border-border bg-palette-neutral-100 p-3">
            <p className="text-xs text-palette-neutral-600">
              To {approval.recipient} · <span className="font-medium">{approval.subject}</span>
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-palette-neutral-800">{approval.body}</pre>
            <p className="mt-2 text-[11px] text-palette-neutral-500">Approving records this email in HireFlow. No email is delivered: the prototype has no email integration.</p>
          </div>
        )}
        {approval?.kind === 'advance' && (
          <div className="rounded-lg bg-palette-neutral-100 p-3 text-xs text-palette-neutral-700">
            <span className="font-semibold">Approving will:</span> move {firstName(candidate)} to {approval.toStage} · {advanceConsequences(approval.toStage).join(' · ')}
          </div>
        )}
        {open && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={() => resolve(task.id, item.id, 'approve')}>
              Approve
            </button>
            {approval?.kind === 'advance' && (
              <button type="button" className={btn.secondary} onClick={() => setView(task.id, { type: 'candidate', candidateId: candidate.id })}>
                Inspect evidence
              </button>
            )}
            <SecondaryActions task={task} item={item} allowDecline />
          </div>
        )}
      </div>
    )
  }

  if (item.kind === 'own-feedback') {
    return open ? (
      <div className="space-y-3">
        <OwnFeedbackForm candidateId={candidate.id} onSubmit={(recommendation, notes) => resolve(task.id, item.id, 'approve', { recommendation, notes })} />
        <div className="flex gap-2">
          <SecondaryActions task={task} item={item} />
        </div>
      </div>
    ) : null
  }

  if (item.kind === 'reminder') {
    const draft = task.drafts.find((entry) => entry.id === item.draftId)
    if (!draft) return null
    return (
      <div className="space-y-2">
        <DraftCard task={task} draft={draft} onApprove={() => resolve(task.id, item.id, 'approve')} onSkip={() => resolve(task.id, item.id, 'skip')} />
        {open && (
          <button type="button" className={btn.ghost} onClick={() => resolve(task.id, item.id, 'defer')}>
            Defer
          </button>
        )}
      </div>
    )
  }

  if (item.kind === 'guide') {
    return (
      <div className="space-y-3">
        {open && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={() => resolve(task.id, item.id, 'approve')}>
              Approve and save guide
            </button>
            <button type="button" className={btn.secondary} onClick={() => setView(task.id, { type: 'interview-guide', candidateId: candidate.id, gapsOnly: true })}>
              Open full editor
            </button>
            <SecondaryActions task={task} item={item} />
          </div>
        )}
        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border p-3">
          <InterviewGuideEditor task={task} candidateId={candidate.id} compact />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-palette-warning-300 bg-palette-warning-100 p-3">
        <FileX className="mt-0.5 h-4 w-4 shrink-0 text-palette-warning-700" aria-hidden="true" />
        <p className="text-xs text-palette-neutral-800">I can't prepare this one. There's no resume, scorecard or criteria for {candidate.name}'s role in HireFlow, so any recommendation would be a guess. Review the profile and decide directly.</p>
      </div>
      {open && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/candidates/${candidate.id}`} className={btn.secondary}>
            Open {firstName(candidate)}'s profile
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <SecondaryActions task={task} item={item} />
        </div>
      )}
    </div>
  )
}

function Summary({ task }: { task: WorkspaceTask }) {
  const sessionGo = useWorkspaceStore((state) => state.sessionGo)
  const items = task.session!.items
  const done = items.filter((item) => item.status === 'done')
  const deferred = items.filter((item) => item.status === 'deferred')
  const attention = items.filter((item) => item.status === 'blocked' || item.status === 'skipped' || item.status === 'todo')
  const groups = [
    { title: 'Completed', items: done, empty: 'Nothing completed.' },
    { title: 'Deferred', items: deferred, empty: 'Nothing deferred.' },
    { title: 'Still needs attention', items: attention, empty: 'Nothing left open.' },
  ]
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-palette-success-300 bg-palette-success-100 p-5">
        <p className="text-base font-semibold text-palette-neutral-900">
          {done.length} of {items.length} tasks cleared
        </p>
        <p className="mt-1 text-sm text-palette-neutral-700">Every change below went through HireFlow's normal records: stages, activity logs and the approvals queue.</p>
      </div>
      {groups.map((group) => (
        <section key={group.title} className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-palette-neutral-900">
            {group.title} · {group.items.length}
          </p>
          {group.items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{group.empty}</p>
          ) : (
            <ul>
              {group.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 border-b border-border px-4 py-2.5 last:border-0">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-palette-neutral-900">{item.title}</p>
                    {item.result && <p className="text-xs text-palette-neutral-600">{item.result}</p>}
                  </div>
                  {group.title !== 'Completed' && (
                    <button type="button" className={btn.ghost} onClick={() => sessionGo(task.id, items.indexOf(item))}>
                      Open
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Link to="/" className={btn.secondary}>
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <Link to="/activity" className={btn.secondary}>
          View activity
        </Link>
      </div>
    </div>
  )
}

export function ClearTasksView({ task }: { task: WorkspaceTask }) {
  const sessionGo = useWorkspaceStore((state) => state.sessionGo)
  const finishSession = useWorkspaceStore((state) => state.finishSession)
  const session = task.session
  if (!session) return null
  const items = session.items
  const done = items.filter((item) => item.status !== 'todo').length
  const current = items[session.index]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <ListChecks className="h-5 w-5 text-palette-brand-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-palette-neutral-900">
            {done} of {items.length} tasks handled
          </p>
          <span className="text-xs text-palette-neutral-550">{items.filter((item) => item.status === 'done').length} completed</span>
          {!session.finished && (
            <button type="button" className={cn(btn.ghost, 'ml-auto')} onClick={() => finishSession(task.id)}>
              Finish for now
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                item.status === 'done' ? 'bg-palette-success-500' : item.status === 'todo' ? (index === session.index && !session.finished ? 'bg-palette-brand-400' : 'bg-palette-neutral-250') : 'bg-palette-warning-400',
              )}
            />
          ))}
        </div>
      </div>

      {session.finished ? (
        <Summary task={task} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
          <ol className="space-y-1 lg:sticky lg:top-0 lg:self-start">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => sessionGo(task.id, index)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    index === session.index ? 'bg-palette-brand-100' : 'hover:bg-muted',
                  )}
                >
                  <span className="mt-0.5">
                    <StatusIcon status={item.status} />
                  </span>
                  <span className={cn('text-[13px] leading-snug', item.status === 'todo' ? 'text-palette-neutral-900' : 'text-palette-neutral-500')}>{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
          {current && (
            <article className="min-w-0 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-palette-neutral-200 px-1.5 py-0.5 text-[11px] font-semibold text-palette-neutral-700">{KIND_LABEL[current.kind]}</span>
                <span className="text-xs text-palette-neutral-500">
                  Task {session.index + 1} of {items.length}
                </span>
                {current.status !== 'todo' && (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-palette-neutral-700">
                    <StatusIcon status={current.status} />
                    {current.result}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-base font-semibold text-palette-neutral-900">{current.title}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Why it matters</Label>
                  <p className="mt-1 text-sm text-palette-neutral-700">{current.why}</p>
                </div>
                <div>
                  <Label>What AI prepared</Label>
                  <p className="mt-1 text-sm text-palette-neutral-700">{current.prepared}</p>
                </div>
              </div>
              <div className="mt-4">
                <ItemBody task={task} item={current} />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                <button type="button" className={btn.ghost} disabled={session.index === 0} onClick={() => sessionGo(task.id, session.index - 1)}>
                  ← Previous
                </button>
                <button type="button" className={btn.ghost} disabled={session.index === items.length - 1} onClick={() => sessionGo(task.id, session.index + 1)}>
                  Next task →
                </button>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  )
}
