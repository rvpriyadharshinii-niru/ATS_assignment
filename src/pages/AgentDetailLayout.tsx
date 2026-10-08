import { Activity, ChevronRight, FlaskConical, Home, Pause, Play, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { AGENT_ICON, formatRelative, isAgentId, primaryButtonClass, secondaryButtonClass } from '../agents/display'
import { actionGate } from '../agents/simulate'
import { AgentStatusPill } from '../components/agents/agentUi'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { IconBadge } from '../components/ui/IconBadge'
import { AGENT_DEFINITIONS, AUTONOMY_LEVELS } from '../data/agents'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { useAgentStore, useAttentionCount } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'

export function AgentDetailLayout() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const pushToast = useAppStore((state) => state.pushToast)
  const record = useAgentStore((state) => (isAgentId(agentId) ? state.agents[agentId] : undefined))
  const tested = useAgentStore((state) => (isAgentId(agentId) ? state.testedAgents.includes(agentId) : false))
  const assessmentApproved = useAgentStore((state) => state.assessmentDraft.approvedVersion !== undefined && !state.assessmentDraft.editedSinceApproval)
  const setStatus = useAgentStore((state) => state.setStatus)
  const runAgentNow = useAgentStore((state) => state.runAgentNow)
  const attention = useAttentionCount(isAgentId(agentId) ? agentId : undefined)
  const [activateOpen, setActivateOpen] = useState(false)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  if (!isAgentId(agentId) || !record) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">This agent isn&rsquo;t available.</p>
        </div>
      </div>
    )
  }

  const definition = AGENT_DEFINITIONS[agentId]
  const config = record.config
  const autonomy = AUTONOMY_LEVELS.find((level) => level.key === config.autonomy)
  const needsApprovedDraft = agentId === 'assessment' && !assessmentApproved
  const canActivate = tested && !needsApprovedDraft

  const approvalActions = definition.actions.filter((action) => config.enabledActions.includes(action.key) && actionGate(agentId, config, action.key).requiresApproval)
  const ownActions = definition.actions.filter((action) => config.enabledActions.includes(action.key) && !actionGate(agentId, config, action.key).requiresApproval)

  const runNow = () => {
    const created = runAgentNow(agentId)
    pushToast(created > 0 ? `${definition.name} ran · ${created} item${created > 1 ? 's' : ''} for you to check.` : `${definition.name} ran · nothing new needs you.`)
    navigate(`/agents/${agentId}/activity`)
  }

  const TABS = [
    { to: 'configure', label: 'Configuration', icon: SlidersHorizontal },
    { to: 'test', label: 'Testing', icon: FlaskConical },
    { to: 'activity', label: 'Activity', icon: Activity, count: attention },
  ]

  return (
    <div>
      <div className="border-b border-border bg-card px-8 pt-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" aria-label="Home" className="hover:text-palette-neutral-900">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
          <Link to="/agents" className="hover:text-palette-neutral-900">
            AI Agents
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-palette-neutral-300" aria-hidden="true" />
          <span className="text-palette-neutral-700">{definition.name}</span>
        </nav>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <IconBadge icon={AGENT_ICON[agentId]} color="brand" size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-palette-neutral-900">{definition.name}</h1>
                <AgentStatusPill status={record.status} />
              </div>
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{definition.shortDescription}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-palette-neutral-500">
                <span>Scope: {config.openingIds.map((id) => getOpening(id)?.title ?? id).join(', ') || 'none'}</span>
                <span>Autonomy: {autonomy?.label}</span>
                <span>
                  Configuration v{record.version} · updated {formatRelative(record.updatedAt)}
                </span>
                {record.lastRunAt && <span>Last run {formatRelative(record.lastRunAt)}</span>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={runNow}
              disabled={record.status !== 'active'}
              title={record.status !== 'active' ? 'Only active agents can run' : 'Run a simulated check of the current hiring data now'}
              className={secondaryButtonClass}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Run now
            </button>
            {record.status === 'active' ? (
              <button
                type="button"
                onClick={() => {
                  setStatus(agentId, 'paused')
                  pushToast(`${definition.name} paused. Pending approvals stay in your queue.`)
                }}
                className={secondaryButtonClass}
              >
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                Pause
              </button>
            ) : (
              <button type="button" onClick={() => setActivateOpen(true)} className={primaryButtonClass}>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                {record.status === 'draft' ? 'Activate' : 'Resume'}
              </button>
            )}
          </div>
        </div>

        <nav className="mt-4 -mb-px flex items-center gap-5" aria-label="Agent sections">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none',
                  isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-palette-neutral-900',
                )
              }
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
              {!!tab.count && <span className="rounded-full bg-palette-warning-150 px-1.5 py-0.5 text-xs font-medium text-palette-warning-700">{tab.count}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />

      {canActivate ? (
        <ConfirmDialog
          open={activateOpen}
          onOpenChange={setActivateOpen}
          title={`${record.status === 'draft' ? 'Activate' : 'Resume'} ${definition.name}?`}
          lines={[`Scope: ${config.openingIds.map((id) => getOpening(id)?.title ?? id).join(', ')}`, `Autonomy: ${autonomy?.label}`]}
          consequences={[
            ownActions.length ? `Let it ${ownActions.map((action) => action.label.charAt(0).toLowerCase() + action.label.slice(1)).join('; ')} on its own` : 'Let it prepare work, but complete nothing on its own',
            approvalActions.length ? `Ask for your approval before it can ${approvalActions.map((action) => action.label.charAt(0).toLowerCase() + action.label.slice(1)).join('; ')}` : 'Ask for your approval on anything consequential',
            'Log everything it does in Activity',
          ]}
          confirmLabel={record.status === 'draft' ? 'Activate agent' : 'Resume agent'}
          onConfirm={() => {
            setStatus(agentId, 'active')
            setActivateOpen(false)
            pushToast(`${definition.name} is active.`)
          }}
        />
      ) : (
        <ConfirmDialog
          open={activateOpen}
          onOpenChange={setActivateOpen}
          title="Test before activating"
          lines={[needsApprovedDraft ? 'Review, edit and approve the draft assessment in Testing first.' : 'Run at least one test so you can see how the agent behaves with your settings.']}
          consequences={['Open the Testing tab', 'Nothing is changed or sent while testing']}
          confirmLabel="Go to Testing"
          onConfirm={() => {
            setActivateOpen(false)
            navigate(`/agents/${agentId}/test`)
          }}
        />
      )}
    </div>
  )
}
