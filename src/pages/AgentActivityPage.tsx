import { useParams } from 'react-router-dom'
import { isAgentId } from '../agents/display'
import { AgentActivityList } from '../components/agents/AgentActivityList'
import { AGENT_DEFINITIONS } from '../data/agents'

export function AgentActivityPage() {
  const { agentId } = useParams<{ agentId: string }>()
  if (!isAgentId(agentId)) return null
  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-palette-neutral-900">Activity</h2>
        <p className="text-sm text-muted-foreground">
          Everything the {AGENT_DEFINITIONS[agentId].name} did or proposed, why, and what happened next.
        </p>
      </div>
      <AgentActivityList key={agentId} agentId={agentId} emptyMessage="This agent hasn’t done anything yet." />
    </div>
  )
}
