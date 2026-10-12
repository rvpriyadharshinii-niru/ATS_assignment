import { ArrowRight, CircleAlert, CircleHelp, ClipboardList, Hourglass, Lock, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_COLOR, AGENT_ICON, formatRelative } from '../agents/display'
import { AgentStatusPill } from '../components/agents/agentUi'
import { IconBadge } from '../components/ui/IconBadge'
import { AGENT_DEFINITIONS, AGENT_ORDER, AUTONOMY_LEVELS } from '../data/agents'
import type { AgentId } from '../types/agents'
import { getOpening } from '../data/openings'
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

function AgentCard({ agentId }: { agentId: AgentId }) {
  const definition = AGENT_DEFINITIONS[agentId]
  const record = useAgentStore((state) => state.agents[agentId])
  const activity = useAgentStore((state) => state.activity)
  const agentActivity = activity.filter((item) => item.agentId === agentId).sort((a, b) => b.timestamp - a.timestamp)
  const latest = agentActivity[0]
  const waiting = agentActivity.filter((item) => item.status === 'pending' || item.status === 'needs-review').length
  const tone = AGENT_COLOR[agentId]
  const scope = record.config.openingIds.map((id) => getOpening(id)?.title ?? id).join(', ')

  return (
    <Link
      to={`/agents/${agentId}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        tone.ring,
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', tone.band)} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <IconBadge icon={AGENT_ICON[agentId]} color={tone.badge} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-palette-neutral-900">{definition.name}</h2>
            <AgentStatusPill status={record.status} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-palette-neutral-600">{definition.shortDescription}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl bg-palette-neutral-100 px-4 py-3 text-sm">
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-palette-neutral-550">Works on</dt>
          <dd className="mt-0.5 sm:truncate font-medium text-palette-neutral-800">{scope || 'No jobs yet'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-palette-neutral-550">Autonomy</dt>
          <dd className="mt-0.5 sm:truncate font-medium text-palette-neutral-800">{AUTONOMY_LEVELS.find((level) => level.key === record.config.autonomy)?.label}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-1 items-end justify-between gap-3">
        <div className="min-w-0 text-sm">
          {waiting > 0 ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-palette-warning-150 px-2.5 py-1 text-xs font-semibold text-palette-warning-700">
              <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
              {waiting} waiting on you
            </p>
          ) : (
            <p className="text-xs text-palette-neutral-550">Nothing waiting on you</p>
          )}
          {latest && (
            <p className="mt-1.5 truncate text-xs text-palette-neutral-550" title={latest.title}>
              Last: {latest.title} · {formatRelative(latest.timestamp)}
            </p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary group-hover:gap-1.5">
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export function AgentsWorkspacePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const activity = useAgentStore((state) => state.activity)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  const pending = activity.filter((item) => item.status === 'pending').length
  const needsReview = activity.filter((item) => item.status === 'needs-review').length

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">AI Agents</h1>
        <p className="mt-1 max-w-2xl text-sm text-palette-neutral-600">
          Specialised agents that prepare hiring work for you. Open an agent to run it, review what it prepared and approve the next step.
        </p>
      </div>

      {(pending > 0 || needsReview > 0) && (
        <Link
          to="/activity"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-palette-warning-300 bg-palette-warning-100 px-4 py-3 text-sm hover:bg-palette-warning-150"
        >
          <CircleAlert className="h-4 w-4 text-palette-warning-700" aria-hidden="true" />
          <span className="font-medium text-palette-neutral-900">
            {pending + needsReview} agent {pending + needsReview === 1 ? 'proposal is' : 'proposals are'} waiting for you
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-palette-warning-700">
            Review in Approvals
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {AGENT_ORDER.map((agentId) => (
          <AgentCard key={agentId} agentId={agentId} />
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
          <IconBadge icon={ShieldCheck} color="success" size="sm" />
          How agents stay supervised
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="flex gap-2.5">
              <principle.icon className="mt-0.5 h-4 w-4 shrink-0 text-palette-success-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-palette-neutral-900">{principle.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-palette-neutral-600">{principle.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
