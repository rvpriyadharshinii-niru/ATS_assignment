import { Bot, CircleAlert, CircleCheck, CircleHelp, ClipboardList, Hourglass, Lock, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AGENT_ICON, formatRelative } from '../agents/display'
import { AgentActivityList } from '../components/agents/AgentActivityList'
import { AgentStatusPill } from '../components/agents/agentUi'
import { AgentsIntro } from '../components/agents/AgentsIntro'
import { PageHeader } from '../components/layout/PageHeader'
import { IconBadge, type IconBadgeColor } from '../components/ui/IconBadge'
import { AGENT_DEFINITIONS, AGENT_ORDER, AUTONOMY_LEVELS } from '../data/agents'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { useAgentStore } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'

type WorkspaceTab = 'agents' | 'approvals' | 'activity'

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

const WEEK = 7 * 24 * 60 * 60 * 1000

function AgentsTable() {
  const agents = useAgentStore((state) => state.agents)
  const activity = useAgentStore((state) => state.activity)

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-palette-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">
            <th className="px-4 py-2.5">Agent</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Scope</th>
            <th className="px-3 py-2.5">Autonomy</th>
            <th className="px-3 py-2.5">Recent activity</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {AGENT_ORDER.map((agentId) => {
            const definition = AGENT_DEFINITIONS[agentId]
            const record = agents[agentId]
            const agentActivity = activity.filter((item) => item.agentId === agentId).sort((a, b) => b.timestamp - a.timestamp)
            const latest = agentActivity[0]
            const waiting = agentActivity.filter((item) => item.status === 'pending' || item.status === 'needs-review').length
            return (
              <tr key={agentId} className="border-b border-border align-top last:border-0 hover:bg-muted/60">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <IconBadge icon={AGENT_ICON[agentId]} color="brand" size="sm" className="mt-0.5" />
                    <div className="min-w-[220px] max-w-sm">
                      <Link
                        to={`/agents/${agentId}/configure`}
                        className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline"
                      >
                        {definition.name}
                      </Link>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{definition.shortDescription}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <AgentStatusPill status={record.status} />
                </td>
                <td className="px-3 py-3 text-foreground">
                  {record.config.openingIds.map((id) => getOpening(id)?.title ?? id).join(', ') || <span className="text-muted-foreground">No openings</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-foreground">{AUTONOMY_LEVELS.find((level) => level.key === record.config.autonomy)?.label}</td>
                <td className="max-w-[260px] px-3 py-3">
                  {latest ? (
                    <>
                      <p className="truncate text-foreground" title={latest.title}>
                        {latest.title}
                      </p>
                      <p className="text-xs text-palette-neutral-500">
                        {formatRelative(latest.timestamp)}
                        {waiting > 0 && <span className="font-medium text-palette-warning-700"> · {waiting} waiting on you</span>}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No activity yet</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 text-sm font-medium">
                    <Link to={`/agents/${agentId}/configure`} className="text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline">
                      Configure
                    </Link>
                    <Link to={`/agents/${agentId}/test`} className="text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline">
                      Test
                    </Link>
                    <Link to={`/agents/${agentId}/activity`} className="text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:underline">
                      View activity
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AgentsWorkspacePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const agents = useAgentStore((state) => state.agents)
  const activity = useAgentStore((state) => state.activity)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: WorkspaceTab = tabParam === 'approvals' || tabParam === 'activity' ? tabParam : 'agents'

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  const pending = activity.filter((item) => item.status === 'pending').length
  const needsReview = activity.filter((item) => item.status === 'needs-review').length
  const failed = activity.filter((item) => item.status === 'failed').length
  const latestTimestamp = activity.reduce((max, item) => Math.max(max, item.timestamp), 0)
  const completedThisWeek = activity.filter((item) => item.status === 'completed' && item.timestamp > latestTimestamp - WEEK).length
  const activeCount = AGENT_ORDER.filter((id) => agents[id].status === 'active').length
  const pausedCount = AGENT_ORDER.filter((id) => agents[id].status === 'paused').length
  const draftCount = AGENT_ORDER.filter((id) => agents[id].status === 'draft').length
  const inactiveSummary = [pausedCount ? `${pausedCount} paused` : '', draftCount ? `${draftCount} draft` : ''].filter(Boolean).join(' · ')

  const METRICS: { label: string; value: string; icon: typeof Bot; color: IconBadgeColor; secondary?: string }[] = [
    { label: 'Active agents', value: `${activeCount} of ${AGENT_ORDER.length}`, icon: Bot, color: 'neutral', secondary: inactiveSummary || undefined },
    { label: 'Awaiting your approval', value: String(pending), icon: Hourglass, color: pending ? 'warning' : 'neutral', secondary: 'Nothing happens until you approve' },
    { label: 'Needs your review', value: String(needsReview), icon: CircleAlert, color: needsReview ? 'warning' : 'neutral', secondary: failed ? `${failed} failed run${failed > 1 ? 's' : ''} to retry` : 'Thin or mixed evidence' },
    { label: 'Completed this week', value: String(completedThisWeek), icon: CircleCheck, color: 'neutral', secondary: 'Summaries, reminders, guides' },
  ]

  const TABS: { key: WorkspaceTab; label: string; count?: number }[] = [
    { key: 'agents', label: 'Agents', count: AGENT_ORDER.length },
    { key: 'approvals', label: 'Approvals', count: pending + needsReview },
    { key: 'activity', label: 'Activity log', count: activity.length },
  ]

  return (
    <div>
      <PageHeader
        title="AI Agents"
        description="Specialised agents that prepare recruitment work proactively. You set their scope, and approve every consequential step."
        backTo="/"
      />
      <div className="space-y-5 p-6">
        <AgentsIntro />

        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Agents workspace">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={tab === entry.key}
              onClick={() => setSearchParams(entry.key === 'agents' ? {} : { tab: entry.key })}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tab === entry.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {entry.label}
              {entry.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    tab === entry.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-palette-neutral-200 text-palette-neutral-600',
                  )}
                >
                  {entry.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'agents' && (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {METRICS.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <IconBadge icon={metric.icon} color={metric.color} size="sm" />
                    <div className="min-w-0">
                      <p className="text-2xl font-bold leading-tight tracking-tight text-palette-neutral-900">{metric.value}</p>
                      <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
                      {metric.secondary && <p className="mt-1 truncate text-xs text-palette-neutral-500">{metric.secondary}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AgentsTable />

            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
                <IconBadge icon={ShieldCheck} color="success" size="sm" />
                How agents stay supervised
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {PRINCIPLES.map((principle) => (
                  <div key={principle.title} className="flex gap-2.5">
                    <principle.icon className="mt-0.5 h-4 w-4 shrink-0 text-palette-neutral-500" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-palette-neutral-900">{principle.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{principle.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'approvals' && (
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-palette-neutral-900">Awaiting your approval</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Nothing here has happened yet. Approving runs the same action as doing it yourself in HireFlow.</p>
              <div className="mt-3">
                <AgentActivityList onlyStatus="pending" emptyMessage="No proposals are waiting for approval." />
              </div>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-palette-neutral-900">Needs your review</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Cases an agent wouldn&rsquo;t decide on its own — usually because the evidence is thin or mixed.</p>
              <div className="mt-3">
                <AgentActivityList onlyStatus="needs-review" emptyMessage="Nothing needs your review right now." />
              </div>
            </section>
          </div>
        )}

        {tab === 'activity' && <AgentActivityList />}
      </div>
    </div>
  )
}
