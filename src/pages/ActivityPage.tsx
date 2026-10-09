import { ArrowRight, Bot, CheckCheck, History, Inbox, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AgentActivityList } from '../components/agents/AgentActivityList'
import { EmptyState, Label } from '../components/workspace/ui'
import { relativeTime } from '../components/workspace/styles'
import { getCandidate } from '../data/candidates'
import { cn } from '../lib/cn'
import { useAgentStore } from '../store/useAgentStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { NotificationsPage } from './NotificationsPage'

type Tab = 'waiting' | 'agents' | 'events'

interface WorkspaceApproval {
  id: string
  taskId: string
  taskTitle: string
  title: string
  detail: string
  updatedAt: number
}

/** Proposals and drafts prepared inside AI Workspace tasks that still need a person's decision. */
function useWorkspaceApprovals(): WorkspaceApproval[] {
  const tasks = useWorkspaceStore((state) => state.tasks)
  const order = useWorkspaceStore((state) => state.order)
  const items: WorkspaceApproval[] = []
  for (const id of order) {
    const task = tasks[id]
    if (!task) continue
    for (const message of task.messages) {
      if (message.proposal?.state === 'open') {
        items.push({ id: message.id, taskId: task.id, taskTitle: task.title, title: message.proposal.title, detail: message.proposal.consequences.join(' · '), updatedAt: message.createdAt })
      }
    }
    if (task.kind === 'follow-ups') {
      for (const draft of task.drafts.filter((entry) => entry.status === 'draft')) {
        items.push({
          id: draft.id,
          taskId: task.id,
          taskTitle: task.title,
          title: `${draft.audience === 'Interviewer' ? 'Reminder' : 'Message'} to ${draft.recipient}`,
          detail: `${getCandidate(draft.candidateId)?.name ?? ''} · ${draft.reason}`,
          updatedAt: task.updatedAt,
        })
      }
    }
  }
  return items
}

export function ActivityPage() {
  const [tab, setTab] = useState<Tab>('waiting')
  const workspaceApprovals = useWorkspaceApprovals()
  const agentPending = useAgentStore((state) => state.activity.filter((item) => item.status === 'pending').length)
  const agentReview = useAgentStore((state) => state.activity.filter((item) => item.status === 'needs-review').length)
  const waiting = workspaceApprovals.length + agentPending + agentReview

  const tabs: { key: Tab; label: string; icon: typeof Inbox; count?: number }[] = [
    { key: 'waiting', label: 'Waiting on you', icon: Inbox, count: waiting },
    { key: 'agents', label: 'AI agent activity', icon: Bot },
    { key: 'events', label: 'Hiring events', icon: History },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">Approvals &amp; activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything AI has proposed waits here until you approve it, and every change that did happen is on the record. Nothing is sent or moved without you.
        </p>
      </div>

      <nav className="-mb-px flex gap-5 overflow-x-auto border-b border-border" aria-label="Activity sections">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            aria-current={tab === entry.key ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2.5 text-sm font-medium',
              tab === entry.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-palette-neutral-900',
            )}
          >
            <entry.icon className="h-4 w-4" aria-hidden="true" />
            {entry.label}
            {!!entry.count && <span className="rounded-full bg-palette-warning-150 px-1.5 text-[11px] font-semibold text-palette-warning-700">{entry.count}</span>}
          </button>
        ))}
      </nav>

      {tab === 'waiting' && (
        <div className="space-y-6">
          {waiting === 0 && <EmptyState icon={CheckCheck} title="Nothing is waiting on you" body="New proposals from AI tasks and agents will appear here for approval." />}
          {workspaceApprovals.length > 0 && (
            <section>
              <Label className="mb-2">From your AI Workspace tasks · {workspaceApprovals.length}</Label>
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {workspaceApprovals.map((item) => (
                  <li key={item.id}>
                    <Link to={`/workspace/${item.taskId}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted">
                      <Sparkles className="h-4 w-4 shrink-0 text-palette-brand-500" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-palette-neutral-900">{item.title}</span>
                        <span className="block truncate text-xs text-palette-neutral-550">
                          {item.detail} · in “{item.taskTitle}” · {relativeTime(item.updatedAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-primary">
                        Review <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {agentPending > 0 && (
            <section>
              <Label className="mb-2">Proposed by AI agents · {agentPending}</Label>
              <AgentActivityList onlyStatus="pending" showFilters={false} />
            </section>
          )}
          {agentReview > 0 && (
            <section>
              <Label className="mb-2">Agents couldn’t decide, needs your review · {agentReview}</Label>
              <AgentActivityList onlyStatus="needs-review" showFilters={false} />
            </section>
          )}
        </div>
      )}
      {tab === 'agents' && <AgentActivityList />}
      {tab === 'events' && <NotificationsPage embedded />}
    </div>
  )
}
