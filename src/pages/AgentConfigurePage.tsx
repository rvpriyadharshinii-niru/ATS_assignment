import { ArrowRight, Ban, CheckCircle2, Hourglass, Lock, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { inputClass, isAgentId, primaryButtonClass, secondaryButtonClass, sectionLabelClass } from '../agents/display'
import { actionGate } from '../agents/simulate'
import { IconBadge } from '../components/ui/IconBadge'
import { AGENT_DEFINITIONS, AUTONOMY_LEVELS, NEVER_USED_INFORMATION, REFINEMENTS } from '../data/agents'
import { getCriteria } from '../data/criteria'
import { openings } from '../data/openings'
import { cn } from '../lib/cn'
import { useAgentStore } from '../store/useAgentStore'
import { useAppStore } from '../store/useAppStore'
import type { AgentConfig, AgentId } from '../types/agents'
import type { OpeningId } from '../types/domain'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-sm font-semibold text-palette-neutral-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-palette-neutral-350',
        disabled && 'opacity-60',
      )}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  )
}

function ConfigForm({ agentId }: { agentId: AgentId }) {
  const record = useAgentStore((state) => state.agents[agentId])
  const saveConfig = useAgentStore((state) => state.saveConfig)
  const removeRefinement = useAgentStore((state) => state.removeRefinement)
  const pushToast = useAppStore((state) => state.pushToast)
  useAppStore((state) => state.criteriaVersion)
  const [form, setForm] = useState<AgentConfig>(record.config)
  const definition = AGENT_DEFINITIONS[agentId]
  const dirty = JSON.stringify(form) !== JSON.stringify(record.config)

  const update = (patch: Partial<AgentConfig>) => setForm((current) => ({ ...current, ...patch }))
  const toggleIn = (list: string[], key: string, on: boolean) => (on ? [...new Set([...list, key])] : list.filter((entry) => entry !== key))

  const enabledActions = definition.actions.filter((action) => form.enabledActions.includes(action.key))
  const onItsOwn = enabledActions.filter((action) => !actionGate(agentId, form, action.key).requiresApproval)
  const needsApproval = enabledActions.filter((action) => actionGate(agentId, form, action.key).requiresApproval)
  const primaryOpening = form.openingIds[0]
  const criteria = primaryOpening ? getCriteria(primaryOpening) : []

  return (
    <div className="grid grid-cols-1 gap-5 p-6 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <Section title="Objective" description="What this agent is for, in your words. It shapes everything the agent prepares.">
          <textarea aria-label="Agent objective" rows={3} className={inputClass} value={form.objective} onChange={(event) => update({ objective: event.target.value })} />
        </Section>

        <Section title="Assigned job openings" description="The agent only works on candidates in these openings.">
          <ul className="divide-y divide-border rounded-lg border border-border">
            {openings.map((opening) => {
              const checked = form.openingIds.includes(opening.id)
              return (
                <li key={opening.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => update({ openingIds: toggleIn(form.openingIds, opening.id, event.target.checked) as OpeningId[] })}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-palette-neutral-900">{opening.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {opening.totalCandidates} candidates
                        {!opening.hasDetailedData && ' · Limited sample data in this prototype — runs will find little to act on'}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {form.openingIds.length === 0 && <p className="mt-2 text-xs font-medium text-palette-warning-700">Assign at least one opening, or the agent has nothing to work on.</p>}
        </Section>

        <Section title="Data sources & accessible information" description="What the agent may read. It never sees more than you could in HireFlow.">
          <ul className="divide-y divide-border rounded-lg border border-border">
            {definition.dataSources.map((source) => {
              const on = source.required || form.enabledDataSources.includes(source.key)
              return (
                <li key={source.key} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-palette-neutral-900">{source.label}</p>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                  {source.required && <span className="text-xs font-medium text-palette-neutral-500">Required</span>}
                  <Toggle
                    label={source.label}
                    checked={on}
                    disabled={source.required}
                    onChange={(next) => update({ enabledDataSources: toggleIn(form.enabledDataSources, source.key, next) })}
                  />
                </li>
              )
            })}
          </ul>
          <div className="mt-3 rounded-lg bg-muted p-3.5">
            <p className={cn(sectionLabelClass, 'flex items-center gap-1.5')}>
              <Lock className="h-3 w-3" aria-hidden="true" />
              Never used, by any agent
            </p>
            <ul className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-0.5 md:grid-cols-2">
              {NEVER_USED_INFORMATION.map((item) => (
                <li key={item} className="text-xs text-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Instructions & evaluation criteria" description="How the agent should work. Plain language is fine.">
          <textarea aria-label="Agent instructions" rows={4} className={inputClass} value={form.instructions} onChange={(event) => update({ instructions: event.target.value })} />

          {(record.config.refinements.length > 0 || record.config.notes.length > 0) && (
            <div className="mt-3">
              <p className={sectionLabelClass}>Refinements from testing</p>
              <ul className="mt-1.5 space-y-1.5">
                {record.config.refinements.map((key) => (
                  <li key={key} className="flex items-start justify-between gap-3 rounded-lg border border-palette-brand-200 bg-palette-brand-100/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-palette-neutral-900">{REFINEMENTS[key].label}</p>
                      <p className="text-xs text-muted-foreground">{REFINEMENTS[key].instruction}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove refinement: ${REFINEMENTS[key].label}`}
                      onClick={() => {
                        removeRefinement(agentId, key)
                        pushToast('Refinement removed.')
                      }}
                      className="rounded-md p-1 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {record.config.notes.map((note) => (
                  <li key={note} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                    <span className="text-xs text-muted-foreground">Feedback note: </span>“{note}”
                  </li>
                ))}
              </ul>
            </div>
          )}

          {definition.usesCriteria && primaryOpening && (
            <div className="mt-4 border-t border-border pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className={sectionLabelClass}>Evaluation criteria · {openings.find((opening) => opening.id === primaryOpening)?.title}</p>
                <Link to={`/openings/${primaryOpening}/criteria`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-palette-brand-600">
                  Edit in Hiring Criteria
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              {criteria.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted-foreground">No hiring criteria are configured for this opening yet.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {criteria.map((criterion) => (
                    <li key={criterion.key} className="rounded-full bg-palette-neutral-150 px-2.5 py-1 text-xs font-medium text-palette-neutral-700">
                      {criterion.name} · {criterion.priority}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted-foreground">The agent uses the same criteria as the rest of HireFlow, so changes there apply here immediately.</p>
            </div>
          )}
        </Section>

        <Section title="Available actions" description="Turn off anything you don’t want this agent to do. Consequential actions always need your approval.">
          <ul className="divide-y divide-border rounded-lg border border-border">
            {definition.actions.map((action) => {
              const enabled = form.enabledActions.includes(action.key)
              const consequential = action.risk === 'consequential'
              const approval = consequential || form.autonomy === 'suggest' || form.approvalRequired.includes(action.key)
              return (
                <li key={action.key} className="flex items-start gap-3 px-3.5 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Enable: ${action.label}`}
                    checked={enabled}
                    onChange={(event) => update({ enabledActions: toggleIn(form.enabledActions, action.key, event.target.checked) })}
                    className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn('text-sm font-medium', enabled ? 'text-palette-neutral-900' : 'text-muted-foreground')}>{action.label}</p>
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                          consequential ? 'bg-palette-warning-150 text-palette-warning-700' : 'bg-palette-neutral-150 text-palette-neutral-600',
                        )}
                      >
                        {consequential ? 'Consequential' : 'Internal'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">{consequential ? 'Always needs approval' : 'Needs approval'}</span>
                    {consequential ? (
                      <Lock className="h-4 w-4 text-palette-neutral-400" aria-label="Locked: always requires approval" />
                    ) : (
                      <Toggle
                        label={`Require approval: ${action.label}`}
                        checked={approval}
                        disabled={!enabled || form.autonomy === 'suggest'}
                        onChange={(next) => update({ approvalRequired: toggleIn(form.approvalRequired, action.key, next) })}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {form.autonomy === 'suggest' && <p className="mt-2 text-xs text-muted-foreground">With “Suggest only”, every action needs approval.</p>}
        </Section>

        <Section title="Autonomy level" description="How far the agent may go before checking with you.">
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3" role="radiogroup" aria-label="Autonomy level">
            {AUTONOMY_LEVELS.map((level) => {
              const selected = form.autonomy === level.key
              return (
                <button
                  key={level.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ autonomy: level.key })}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary bg-palette-brand-100/50' : 'border-border hover:bg-muted/60',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-palette-neutral-400')}>
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm font-semibold text-palette-neutral-900">{level.label}</span>
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{level.description}</span>
                </button>
              )
            })}
          </div>
        </Section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">What this agent can do</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Updates as you change settings.</p>

          <div className="mt-3.5">
            <p className={cn(sectionLabelClass, 'flex items-center gap-1.5 text-palette-success-700')}>
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              On its own
            </p>
            {onItsOwn.length ? (
              <ul className="mt-1.5 space-y-1">
                {onItsOwn.map((action) => (
                  <li key={action.key} className="text-sm text-foreground">
                    {action.label}
                    {form.autonomy !== 'routine' && <span className="text-xs text-muted-foreground"> (prepares; you see it in Activity)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">Nothing — every action waits for you.</p>
            )}
          </div>

          <div className="mt-3.5 border-t border-border pt-3.5">
            <p className={cn(sectionLabelClass, 'flex items-center gap-1.5 text-palette-brand-700')}>
              <Hourglass className="h-3 w-3" aria-hidden="true" />
              With your approval
            </p>
            {needsApproval.length ? (
              <ul className="mt-1.5 space-y-1">
                {needsApproval.map((action) => (
                  <li key={action.key} className="text-sm text-foreground">
                    {action.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">No enabled actions need approval.</p>
            )}
          </div>

          <div className="mt-3.5 border-t border-border pt-3.5">
            <p className={cn(sectionLabelClass, 'flex items-center gap-1.5 text-palette-danger-700')}>
              <Ban className="h-3 w-3" aria-hidden="true" />
              Never
            </p>
            <ul className="mt-1.5 space-y-1">
              {definition.guardrails.map((guardrail) => (
                <li key={guardrail} className="text-sm text-foreground">
                  {guardrail}
                </li>
              ))}
              {definition.actions
                .filter((action) => !form.enabledActions.includes(action.key))
                .map((action) => (
                  <li key={action.key} className="text-sm text-muted-foreground">
                    {action.label} <span className="text-xs">(turned off)</span>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <IconBadge icon={CheckCircle2} color="neutral" size="sm" />
            <h2 className="text-sm font-semibold text-palette-neutral-900">Capabilities</h2>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {definition.capabilities.map((capability) => (
              <li key={capability} className="flex gap-2 text-sm text-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-palette-neutral-400" aria-hidden="true" />
                {capability}
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {dirty && (
        <div className="sticky bottom-4 z-20 xl:col-span-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <p className="text-sm text-foreground">
              Unsaved changes. Saving creates configuration v{record.version + 1}; the agent uses it from its next run.
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setForm(record.config)}>
                Discard
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  saveConfig(agentId, { ...form, refinements: record.config.refinements, notes: record.config.notes })
                  pushToast(`${definition.name} configuration saved (v${record.version + 1}).`)
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AgentConfigurePage() {
  const { agentId } = useParams<{ agentId: string }>()
  if (!isAgentId(agentId)) return null
  return <ConfigFormKeyed agentId={agentId} />
}

/** Remounts the form whenever the saved configuration changes, so it always starts from the latest version. */
function ConfigFormKeyed({ agentId }: { agentId: AgentId }) {
  const version = useAgentStore((state) => state.agents[agentId].version)
  return <ConfigForm key={`${agentId}-${version}`} agentId={agentId} />
}
