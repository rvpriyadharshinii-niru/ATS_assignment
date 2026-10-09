import { ArrowRight, Bell, Bot, History, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AGENT_DEFINITIONS } from '../../../data/agents'
import { getCandidate } from '../../../data/candidates'
import { staticNotifications } from '../../../data/notifications'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAppStore } from '../../../store/useAppStore'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { WorkspaceTask } from '../../../types/workspace'
import { attentionItems } from '../../../workspace/derive'
import { ActivityStatusPill } from '../../agents/agentUi'
import { Label } from '../ui'
import { btn, relativeTime, useNow } from '../styles'

const DAY = 24 * 60 * 60 * 1000

export function BriefingView({ task, mode }: { task: WorkspaceTask; mode: 'changes' | 'attention' }) {
  const all = useAllEffectiveCandidates()
  const activity = useAgentStore((state) => state.activity)
  const log = useAppStore((state) => state.activityLog)
  const send = useWorkspaceStore((state) => state.send)
  const now = useNow()
  const pending = activity.filter((item) => item.status === 'pending' || item.status === 'needs-review').length

  if (mode === 'attention') {
    const items = attentionItems(all, pending)
    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.tone === 'urgent' ? 'bg-palette-danger-500' : 'bg-palette-brand-400')} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-palette-neutral-900">{item.what}</p>
              <p className="mt-0.5 text-sm text-palette-neutral-700">{item.why}</p>
              <p className="mt-1 text-xs text-palette-brand-700">Prepared: {item.prepared}</p>
            </div>
            <button type="button" className={btn.secondary} onClick={() => send(task.id, item.query)}>
              {item.cta}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const since = now - 2 * DAY
  const agentItems = activity.filter((item) => item.timestamp >= since).sort((a, b) => b.timestamp - a.timestamp)
  return (
    <div className="space-y-5">
      <section>
        <Label className="mb-2">New in your openings</Label>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {staticNotifications.map((notification) => (
            <li key={notification.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-palette-neutral-900">{notification.title}</p>
                <p className="text-xs text-palette-neutral-550">
                  {notification.detail} · {relativeTime(notification.timestamp)}
                </p>
              </div>
              {notification.category === 'candidates' && notification.id === 'notif-spd-screening' ? (
                <button type="button" className={btn.chip} onClick={() => send(task.id, "Review today's new applicants")}>
                  Review with AI
                </button>
              ) : notification.category === 'interviews' ? (
                <button type="button" className={btn.chip} onClick={() => send(task.id, 'Prepare follow-ups for everyone waiting on feedback')}>
                  Prepare follow-ups
                </button>
              ) : (
                notification.action && (
                  <Link to={notification.action.to} className={btn.chip}>
                    {notification.action.label}
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <Label>What your agents did</Label>
          <Link to="/activity" className="text-xs font-medium text-palette-neutral-600 hover:text-palette-brand-700">
            All activity
          </Link>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {agentItems.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No agent activity in the last two days.</li>}
          {agentItems.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-palette-neutral-900">{item.title}</p>
                <p className="text-xs text-palette-neutral-550">
                  {AGENT_DEFINITIONS[item.agentId].name} · {relativeTime(item.timestamp)}
                  {item.failureReason ? ` · ${item.failureReason}` : ''}
                </p>
              </div>
              <ActivityStatusPill status={item.status} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Label className="mb-2">Changes you made this session</Label>
        {log.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            <History className="h-4 w-4" aria-hidden="true" />
            Nothing yet. Approvals and moves you make will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {log.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm text-palette-neutral-800">
                  <span className="font-medium">{getCandidate(entry.candidateId)?.name}</span> · {entry.message}
                </p>
                <span className="text-xs text-palette-neutral-500">{relativeTime(entry.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
