import { CheckCircle2, CircleX, Hourglass, Pencil, Play } from 'lucide-react'
import { useState } from 'react'
import { inputClass, primaryButtonClass, secondaryButtonClass, sectionLabelClass } from '../../../agents/display'
import { COORDINATION_SCENARIOS, runCoordinationScenario } from '../../../agents/simulate'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore } from '../../../store/useAgentStore'
import type { CoordinationOutput, CoordinationScenarioId } from '../../../types/agents'
import { SimulatedTag } from '../agentUi'
import { EmptyStudio, StepLabel } from './studioUi'

type Message = CoordinationOutput['messages'][number]

function MessageCard({ message }: { message: Message }) {
  const [draft, setDraft] = useState(message)
  const [editing, setEditing] = useState(false)
  const [decision, setDecision] = useState<'approved' | 'changes' | null>(null)

  return (
    <li className="rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-palette-neutral-900">{message.audience}</span> · To {message.recipient}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            message.external ? 'bg-palette-brand-100 text-palette-brand-700' : 'bg-palette-neutral-150 text-palette-neutral-600',
          )}
        >
          {message.external && <Hourglass className="h-3 w-3" aria-hidden="true" />}
          {message.external ? 'External · needs your approval' : 'Internal'}
        </span>
      </div>
      <div className="space-y-2 px-4 py-3">
        {editing ? (
          <>
            <input aria-label="Subject" className={inputClass} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} />
            <textarea aria-label="Message body" rows={9} className={inputClass} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-palette-neutral-900">{draft.subject}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{draft.body}</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
        {decision === 'approved' ? (
          <p className="flex items-center gap-1.5 text-sm text-palette-success-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Approved in test. In live mode this would be sent to {message.recipient}; nothing was sent.
          </p>
        ) : (
          <>
            <button type="button" className={primaryButtonClass} onClick={() => { setDecision('approved'); setEditing(false) }}>
              {message.external ? 'Approve & send' : 'Approve'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => setEditing((current) => !current)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {editing ? 'Done editing' : 'Edit'}
            </button>
            {draft.body !== message.body || draft.subject !== message.subject ? <span className="text-xs text-muted-foreground">Edited</span> : null}
          </>
        )}
      </div>
    </li>
  )
}

export function CoordinationStudio() {
  const record = useAgentStore((state) => state.agents['interview-coordination'])
  const markTested = useAgentStore((state) => state.markTested)
  const allCandidates = useAllEffectiveCandidates()
  const [scenarioId, setScenarioId] = useState<CoordinationScenarioId>('schedule-final')
  const [output, setOutput] = useState<CoordinationOutput | null>(null)
  const [runKey, setRunKey] = useState(0)

  const run = () => {
    const scenario = COORDINATION_SCENARIOS.find((entry) => entry.id === scenarioId)
    const candidate = allCandidates.find((entry) => entry.id === scenario?.candidateId)
    if (!candidate) return
    setOutput(runCoordinationScenario(scenarioId, candidate, record.config))
    setRunKey((current) => current + 1)
    markTested('interview-coordination')
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <section className="space-y-4 self-start rounded-xl border border-border bg-card p-4 shadow-xs">
        <div>
          <StepLabel step={1}>Scheduling scenario</StepLabel>
          <div className="mt-2 space-y-1" role="radiogroup" aria-label="Scenario">
            {COORDINATION_SCENARIOS.map((scenario) => (
              <label
                key={scenario.id}
                className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2', scenarioId === scenario.id ? 'border-primary bg-palette-brand-100/50' : 'border-transparent hover:bg-muted/60')}
              >
                <input
                  type="radio"
                  name="coordination-scenario"
                  checked={scenarioId === scenario.id}
                  onChange={() => {
                    setScenarioId(scenario.id)
                    setOutput(null)
                  }}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-medium text-palette-neutral-900">{scenario.label}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{scenario.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <button type="button" className={cn(primaryButtonClass, 'w-full')} onClick={run}>
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Run simulation
        </button>
        <p className="text-xs text-muted-foreground">Uses configuration v{record.version} and the live pipeline. Nothing is sent while testing.</p>
      </section>

      <div className="min-w-0 space-y-4">
        {!output ? (
          <EmptyStudio title="Simulate a scheduling scenario" body="See what the agent detects, how it checks the panel’s availability, and the exact messages it would ask you to approve." />
        ) : (
          <>
            <section className="rounded-xl border border-palette-brand-200 bg-palette-brand-100/30 p-5 shadow-xs">
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide text-primary">What the agent detected</span>
                <SimulatedTag />
              </p>
              <ul className="mt-2 space-y-1">
                {output.detected.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-palette-neutral-400" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            {output.calendar.length > 0 && (
              <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <p className={cn(sectionLabelClass, 'px-4 pt-4')}>Panel availability · free/busy only</p>
                <table className="mt-2 w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-border bg-palette-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">
                      <th className="px-4 py-2">Slot</th>
                      {output.calendar[0].attendees.map((attendee) => (
                        <th key={attendee.name} className="px-3 py-2">
                          {attendee.name}
                        </th>
                      ))}
                      <th className="px-3 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.calendar.map((row) => {
                      const allFree = row.attendees.every((attendee) => attendee.available)
                      return (
                        <tr key={row.slot} className={cn('border-b border-border last:border-0', allFree && 'bg-palette-success-100')}>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-palette-neutral-900">{row.slot}</td>
                          {row.attendees.map((attendee) => (
                            <td key={attendee.name} className="whitespace-nowrap px-3 py-2">
                              {attendee.available ? (
                                <span className="inline-flex items-center gap-1 text-palette-success-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  Free
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-palette-danger-700">
                                  <CircleX className="h-3.5 w-3.5" aria-hidden="true" />
                                  {attendee.note ?? 'Busy'}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className={cn('whitespace-nowrap px-3 py-2 text-sm font-medium', allFree ? 'text-palette-success-700' : 'text-muted-foreground')}>
                            {allFree ? 'Works for everyone' : 'Conflict'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            )}

            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <p className={sectionLabelClass}>Proposed plan</p>
              <ol className="mt-2 space-y-1.5">
                {output.plan.map((step, index) => (
                  <li key={step.step} className="flex items-start justify-between gap-3 text-sm">
                    <span className="flex gap-2 text-foreground">
                      <span className="font-semibold text-palette-neutral-500">{index + 1}.</span>
                      {step.step}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                        step.requiresApproval ? 'bg-palette-brand-100 text-palette-brand-700' : 'bg-palette-neutral-150 text-palette-neutral-600',
                      )}
                    >
                      {step.requiresApproval ? 'Needs your approval' : 'Agent can do this'}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <p className={sectionLabelClass}>Communication preview</p>
              <ul className="mt-2 space-y-3" key={runKey}>
                {output.messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
