import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, Pencil, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ACTIVITY_STATUS_LABEL, AGENT_ICON, formatRelative, inputClass, primaryButtonClass, secondaryButtonClass } from '../../agents/display'
import { AGENT_DEFINITIONS, AGENT_ORDER } from '../../data/agents'
import { getCandidate } from '../../data/candidates'
import { getOpening } from '../../data/openings'
import { cn } from '../../lib/cn'
import { useAllEffectiveCandidates } from '../../store/candidateSelectors'
import { useAgentStore } from '../../store/useAgentStore'
import type { AgentActivity, AgentActivityStatus, AgentApproval, AgentId } from '../../types/agents'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { IconBadge } from '../ui/IconBadge'
import { ActivityStatusPill } from './agentUi'

type StatusFilter = 'all' | AgentActivityStatus

const FILTER_ORDER: StatusFilter[] = ['all', 'pending', 'needs-review', 'completed', 'failed', 'declined']

function approveLabel(approval: AgentApproval): string {
  if (approval.kind === 'advance') return `Approve & move to ${approval.toStage}`
  if (approval.kind === 'publish-assessment') return 'Approve & send assessment'
  return 'Approve & send'
}

function MessagePreview({
  approval,
  editing,
  onChange,
}: {
  approval: Extract<AgentApproval, { kind: 'email' | 'internal-message' }>
  editing: boolean
  onChange: (next: Extract<AgentApproval, { kind: 'email' | 'internal-message' }>) => void
}) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <div className="space-y-1 border-b border-border px-3 py-2 text-xs">
        <p>
          <span className="text-muted-foreground">To: </span>
          <span className="font-medium text-foreground">{approval.recipient}</span>
          {approval.kind === 'email' && <span className="ml-2 text-palette-neutral-500">External · candidate</span>}
          {approval.kind === 'internal-message' && <span className="ml-2 text-palette-neutral-500">Internal</span>}
        </p>
        {editing ? (
          <input aria-label="Subject" className={cn(inputClass, 'py-1.5 text-xs')} value={approval.subject} onChange={(event) => onChange({ ...approval, subject: event.target.value })} />
        ) : (
          <p>
            <span className="text-muted-foreground">Subject: </span>
            <span className="font-medium text-foreground">{approval.subject}</span>
          </p>
        )}
      </div>
      {editing ? (
        <textarea
          aria-label="Message"
          rows={8}
          className={cn(inputClass, 'rounded-t-none border-0 text-sm focus:ring-0')}
          value={approval.body}
          onChange={(event) => onChange({ ...approval, body: event.target.value })}
        />
      ) : (
        <p className="whitespace-pre-line px-3 py-2.5 text-sm leading-relaxed text-foreground/90">{approval.body}</p>
      )}
    </div>
  )
}

function ActivityCard({ item, showAgent }: { item: AgentActivity; showAgent: boolean }) {
  const approveActivity = useAgentStore((state) => state.approveActivity)
  const declineActivity = useAgentStore((state) => state.declineActivity)
  const markReviewed = useAgentStore((state) => state.markReviewed)
  const retryActivity = useAgentStore((state) => state.retryActivity)
  const effective = useAllEffectiveCandidates()
  const [showEvidence, setShowEvidence] = useState(item.status === 'pending')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AgentApproval | undefined>(item.approval)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const definition = AGENT_DEFINITIONS[item.agentId]
  const candidate = item.candidateId ? getCandidate(item.candidateId) : undefined
  const opening = item.openingId ? getOpening(item.openingId) : undefined
  const edited = JSON.stringify(draft) !== JSON.stringify(item.approval)

  const approve = () => {
    approveActivity(item.id, edited ? draft : undefined)
    setEditing(false)
    setConfirmOpen(false)
  }

  const consequences = (() => {
    if (!draft) return []
    if (draft.kind === 'advance') {
      return draft.candidateIds.map((id) => {
        const live = effective.find((entry) => entry.id === id)
        return `Move ${live?.name ?? id} from ${live?.stage ?? 'their current stage'} to ${draft.toStage}`
      }).concat(['Log the move and your approval on the candidate’s activity'])
    }
    if (draft.kind === 'publish-assessment') return [`Send “${draft.assessmentTitle}” to ${candidate?.name ?? 'the candidate'}`, 'Log it on the candidate’s activity']
    return []
  })()

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <IconBadge icon={AGENT_ICON[item.agentId]} color="brand" size="sm" className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-palette-neutral-900">{item.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              {showAgent && (
                <>
                  <Link to={`/agents/${item.agentId}/activity`} className="font-medium text-palette-neutral-700 hover:text-primary">
                    {definition.name}
                  </Link>
                  <span aria-hidden="true">·</span>
                </>
              )}
              {opening && (
                <>
                  <span>{opening.title}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              {candidate && (
                <>
                  <Link to={`/candidates/${candidate.id}`} className="font-medium text-palette-neutral-700 hover:text-primary">
                    {candidate.name}
                  </Link>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{formatRelative(item.timestamp)}</span>
            </p>
          </div>
        </div>
        <ActivityStatusPill status={item.status} />
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-foreground">
        <span className="font-medium text-palette-neutral-900">Why: </span>
        {item.reason}
      </p>

      {item.evidence && item.evidence.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowEvidence((current) => !current)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-palette-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showEvidence}
          >
            {showEvidence ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            Evidence ({item.evidence.length})
          </button>
          {showEvidence && (
            <ul className="mt-1.5 space-y-1 border-l-2 border-palette-neutral-300 pl-3">
              {item.evidence.map((line) => (
                <li key={line} className="text-xs leading-relaxed text-foreground/90">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {item.status === 'pending' && draft && (
        <div className="mt-3 rounded-lg border border-palette-brand-200 bg-palette-brand-100/40 p-3">
          <p className="text-xs font-semibold text-palette-brand-700">Needs your approval{item.approvalReason ? ` · ${item.approvalReason}` : ''}</p>
          {draft.kind === 'advance' && (
            <p className="mt-1.5 text-sm text-foreground">
              {draft.candidateIds
                .map((id) => {
                  const live = effective.find((entry) => entry.id === id)
                  return `${live?.name ?? id}: ${live?.stage ?? '—'} → ${draft.toStage}`
                })
                .join(' · ')}
            </p>
          )}
          {draft.kind === 'publish-assessment' && (
            <p className="mt-1.5 text-sm text-foreground">
              Sends “{draft.assessmentTitle}” to {candidate?.name ?? 'the candidate'}.
            </p>
          )}
          {(draft.kind === 'email' || draft.kind === 'internal-message') && (
            <MessagePreview approval={draft} editing={editing} onChange={(next) => setDraft(next)} />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className={primaryButtonClass} onClick={() => (draft.kind === 'advance' || draft.kind === 'publish-assessment' ? setConfirmOpen(true) : approve())}>
              {approveLabel(draft)}
            </button>
            {(draft.kind === 'email' || draft.kind === 'internal-message') && (
              <button type="button" className={secondaryButtonClass} onClick={() => setEditing((current) => !current)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {editing ? 'Done editing' : 'Edit message'}
              </button>
            )}
            <button type="button" className={secondaryButtonClass} onClick={() => declineActivity(item.id)}>
              Decline
            </button>
            {edited && <span className="text-xs text-muted-foreground">Edited — your version will be used.</span>}
          </div>
        </div>
      )}

      {item.status === 'needs-review' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {candidate && (
            <Link to={`/candidates/${candidate.id}`} className={primaryButtonClass}>
              Open {candidate.name.split(' ')[0]}’s profile
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
          <button type="button" className={secondaryButtonClass} onClick={() => markReviewed(item.id)}>
            Mark as reviewed
          </button>
        </div>
      )}

      {item.status === 'failed' && (
        <div className="mt-3 rounded-lg border border-palette-danger-300 bg-palette-danger-100 p-3">
          <p className="flex items-start gap-1.5 text-sm text-palette-danger-700">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {item.failureReason}
          </p>
          <button type="button" className={cn(secondaryButtonClass, 'mt-2.5')} onClick={() => retryActivity(item.id)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {(item.status === 'completed' || item.status === 'declined') && item.resolution && (
        <p className="mt-2.5 flex items-start gap-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <CheckCircle2 className={cn('mt-px h-3.5 w-3.5 shrink-0', item.status === 'completed' ? 'text-palette-success-600' : 'text-palette-neutral-400')} aria-hidden="true" />
          {item.resolution}
        </p>
      )}

      {draft && (draft.kind === 'advance' || draft.kind === 'publish-assessment') && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={draft.kind === 'advance' ? 'Approve this shortlist move?' : 'Send this assessment?'}
          lines={[`Proposed by the ${definition.name}`]}
          consequences={consequences}
          confirmLabel={draft.kind === 'advance' ? 'Approve & move' : 'Approve & send'}
          onConfirm={approve}
        />
      )}
    </li>
  )
}

export function AgentActivityList({
  agentId,
  candidateId,
  initialFilter = 'all',
  emptyMessage = 'No agent activity yet.',
  showFilters = true,
  onlyStatus,
}: {
  agentId?: AgentId
  candidateId?: string
  /** Pins the list to one status (e.g. the Approvals queue) and hides the status chips. */
  onlyStatus?: AgentActivityStatus
  initialFilter?: StatusFilter
  emptyMessage?: string
  showFilters?: boolean
}) {
  const activity = useAgentStore((state) => state.activity)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter)
  const [agentFilter, setAgentFilter] = useState<AgentId | 'all'>('all')

  const scoped = activity
    .filter((item) => (agentId ? item.agentId === agentId : agentFilter === 'all' || item.agentId === agentFilter))
    .filter((item) => !candidateId || item.candidateId === candidateId)
    .sort((a, b) => b.timestamp - a.timestamp)
  const activeFilter: StatusFilter = onlyStatus ?? statusFilter
  const visible = scoped.filter((item) => activeFilter === 'all' || item.status === activeFilter)
  const countFor = (filter: StatusFilter) => (filter === 'all' ? scoped.length : scoped.filter((item) => item.status === filter).length)

  return (
    <div className="space-y-3">
      {showFilters && !onlyStatus && (
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_ORDER.map((filter) => {
            const count = countFor(filter)
            if (filter !== 'all' && filter !== initialFilter && count === 0) return null
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  statusFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {filter === 'all' ? 'All' : ACTIVITY_STATUS_LABEL[filter]}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    statusFilter === filter ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-palette-neutral-200 text-palette-neutral-600',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
          {!agentId && (
            <select
              aria-label="Filter by agent"
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value as AgentId | 'all')}
              className="ml-auto rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-palette-neutral-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="all">All agents</option>
              {AGENT_ORDER.map((id) => (
                <option key={id} value={id}>
                  {AGENT_DEFINITIONS[id].name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <ActivityCard key={item.id} item={item} showAgent={!agentId} />
          ))}
        </ul>
      )}
    </div>
  )
}
