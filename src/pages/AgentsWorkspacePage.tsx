import { ArrowRight, ChevronDown, CircleAlert, CircleHelp, ClipboardList, Lock, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_COLOR, AGENT_ICON } from '../agents/display'
import { IconBadge } from '../components/ui/IconBadge'
import { AGENT_DEFINITIONS, AGENT_ORDER } from '../data/agents'
import type { AgentId } from '../types/agents'
import { cn } from '../lib/cn'
import { useAgentStore } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'You approve consequential steps',
    body: 'Advancing or rejecting candidates, messages to candidates and publishing assessments always wait for you.',
  },
  { icon: ClipboardList, title: 'Evidence behind every recommendation', body: 'Findings cite job-related evidence and where it came from.' },
  { icon: CircleHelp, title: 'Missing is not negative', body: 'Unclear or missing evidence is flagged to validate — never scored against a candidate.' },
  { icon: Lock, title: 'No protected characteristics', body: 'Agents never read or infer age, gender, ethnicity, religion, health or similar.' },
]

const PURPOSE: Record<AgentId, string> = {
  'candidate-review': 'Reviews incoming applicants',
  'interview-coordination': 'Schedules interviews and chases feedback',
  assessment: 'Drafts role-specific assessments',
  'interview-prep': 'Prepares interview guides',
}

const STATUS_LABEL = { active: 'Active', paused: 'Paused', draft: 'Not activated' } as const
const STATUS_DOT = { active: 'bg-palette-success-500', paused: 'bg-palette-warning-500', draft: 'bg-palette-neutral-400' } as const

function AgentCard({ agentId }: { agentId: AgentId }) {
  const definition = AGENT_DEFINITIONS[agentId]
  const record = useAgentStore((state) => state.agents[agentId])
  const waiting = useAgentStore((state) => state.activity.filter((item) => item.agentId === agentId && (item.status === 'pending' || item.status === 'needs-review')).length)

  return (
    <Link
      to={`/agents/${agentId}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-palette-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <IconBadge icon={AGENT_ICON[agentId]} color={AGENT_COLOR[agentId].badge} size="md" />
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold text-palette-neutral-900">{definition.name}</h2>
        <p className="text-sm text-palette-neutral-600">{PURPOSE[agentId]}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-palette-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[record.status])} aria-hidden="true" />
            {STATUS_LABEL[record.status]}
          </span>
          {waiting > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-palette-warning-700">{waiting} awaiting approval</span>
            </>
          )}
        </p>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-palette-neutral-700 group-hover:text-palette-neutral-900 sm:inline-flex">
        Open agent
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-palette-neutral-400 sm:hidden" aria-hidden="true" />
    </Link>
  )
}

export function AgentsWorkspacePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const activity = useAgentStore((state) => state.activity)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  const waiting = activity.filter((item) => item.status === 'pending' || item.status === 'needs-review').length

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">AI Agents</h1>
          <p className="mt-1 text-sm text-palette-neutral-550">Supervised agents that prepare hiring work and ask before anything consequential.</p>
        </div>
        {waiting > 0 && (
          <Link to="/activity" className="inline-flex items-center gap-1.5 rounded-lg border border-palette-warning-300 bg-palette-warning-100 px-3 py-1.5 text-sm font-medium text-palette-warning-800 hover:bg-palette-warning-150">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            {waiting} waiting on you
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {AGENT_ORDER.map((agentId) => (
          <AgentCard key={agentId} agentId={agentId} />
        ))}
      </div>

      <details className="group rounded-xl border border-border px-5 py-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-palette-neutral-700">
          <ShieldCheck className="h-4 w-4 text-palette-success-600" aria-hidden="true" />
          How agents stay supervised
          <ChevronDown className="ml-auto h-4 w-4 text-palette-neutral-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-5 pb-2 md:grid-cols-2 xl:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="flex gap-2.5">
              <principle.icon className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-palette-neutral-900">{principle.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-palette-neutral-600">{principle.body}</p>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
