import { ArrowRight, Inbox } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { isAgentId } from '../agents/display'
import { AgentActivityList } from '../components/agents/AgentActivityList'
import { AGENT_DEFINITIONS } from '../data/agents'
import { useAgentStore } from '../store/useAgentStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'

const WAITING = ['pending', 'needs-review']

export function AgentActivityPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const activity = useAgentStore((state) => state.activity)
  const tasks = useWorkspaceStore((state) => state.tasks)
  if (!isAgentId(agentId)) return null

  const mine = activity.filter((item) => item.agentId === agentId && WAITING.includes(item.status)).length
  const otherAgents = activity.filter((item) => item.agentId !== agentId && WAITING.includes(item.status)).length
  const workspace = Object.values(tasks).reduce(
    (sum, task) => sum + task.messages.filter((message) => message.proposal?.state === 'open').length + (task.kind === 'follow-ups' ? task.drafts.filter((draft) => draft.status === 'draft').length : 0),
    0,
  )
  const elsewhere = otherAgents + workspace

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-palette-neutral-900">Results &amp; approvals</h2>
        <p className="text-sm text-muted-foreground">
          Everything the {AGENT_DEFINITIONS[agentId].name} did or proposed, why, and what happened next.{mine ? ` ${mine} ${mine === 1 ? 'item is' : 'items are'} waiting on you.` : ''}
        </p>
      </div>
      {elsewhere > 0 && (
        <Link
          to="/activity"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-palette-info-250 bg-palette-info-100/70 px-4 py-2.5 text-sm text-palette-info-800 hover:border-palette-info-400"
        >
          <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {elsewhere} more {elsewhere === 1 ? 'item is' : 'items are'} waiting on you elsewhere
            {otherAgents && workspace ? ` (${otherAgents} from other agents, ${workspace} from AI Workspace tasks)` : otherAgents ? ' from other agents' : ' from AI Workspace tasks'}.
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            See everything together <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      )}
      <AgentActivityList key={agentId} agentId={agentId} emptyMessage="This agent hasn’t done anything yet." />
    </div>
  )
}
