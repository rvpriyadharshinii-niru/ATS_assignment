import { ArrowRight, CircleHelp, Database, GitCompareArrows, Hourglass, Lock, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FINDING_LABEL, formatRelative, inputClass, primaryButtonClass, secondaryButtonClass, sectionLabelClass, VERDICT_TONE } from '../../../agents/display'
import { interpretFeedback, runCandidateReview } from '../../../agents/simulate'
import { REFINEMENTS } from '../../../data/agents'
import { openings } from '../../../data/openings'
import { displayStrength } from '../../../lib/evidence'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore, type ReviewRun } from '../../../store/useAgentStore'
import { useAppStore } from '../../../store/useAppStore'
import type { CandidateReviewOutput, RefinementKey } from '../../../types/agents'
import type { OpeningId } from '../../../types/domain'
import { SimulatedTag } from '../agentUi'
import { StepLabel } from './studioUi'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2" title={hint}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-palette-neutral-900">{value}</p>
    </div>
  )
}

function ReviewResult({ run }: { run: ReviewRun }) {
  const output = run.output
  const candidates = useAllEffectiveCandidates()
  const candidate = candidates.find((entry) => entry.id === output.candidateId)
  const strengths = output.criteria.filter((row) => row.finding === 'supporting')
  const gaps = output.criteria.filter((row) => row.finding === 'gap' || row.finding === 'partial')
  const missing = output.criteria.filter((row) => row.finding === 'missing')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-palette-brand-200 bg-palette-brand-100/30 p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide text-primary">Run #{run.runNumber}</span>
              <span>Configuration v{run.configVersion}</span>
              <span>{formatRelative(run.timestamp)}</span>
              <SimulatedTag />
            </p>
            <p className="mt-1.5 text-base font-semibold text-palette-neutral-900">
              {candidate?.name} · {openings.find((opening) => opening.id === output.openingId)?.title}
            </p>
          </div>
          <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', VERDICT_TONE[output.verdict])}>{output.verdictLabel}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{output.summary}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Evidence fit" value={`${output.fit}%`} hint="Weighted by criterion priority, over criteria that have evidence only." />
          <Stat label="Evidence coverage" value={`${output.coverage}%`} hint="Share of the configured criteria weight that has evidence to assess." />
          <Stat label="Confidence" value={output.confidence} hint="Lower when evidence is missing or feedback is mixed." />
        </div>
        {output.refinementsApplied.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Refinements applied: {output.refinementsApplied.map((key) => REFINEMENTS[key].label).join(' · ')}
          </p>
        )}
      </div>

      <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-palette-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">
              <th className="px-3 py-2.5">Requirement</th>
              <th className="px-3 py-2.5">Evidence</th>
              <th className="px-3 py-2.5">Finding</th>
              <th className="px-3 py-2.5">Supporting detail &amp; source</th>
            </tr>
          </thead>
          <tbody>
            {output.criteria.map((row) => (
              <tr key={row.key} className="border-b border-border align-top last:border-0">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-palette-neutral-900">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.priority} priority · weight {row.weight}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-foreground">{displayStrength(row.strength)}</td>
                <td className={cn('whitespace-nowrap px-3 py-2.5 text-sm font-medium', FINDING_LABEL[row.finding].className)}>{FINDING_LABEL[row.finding].label}</td>
                <td className="px-3 py-2.5">
                  <p className="text-sm leading-relaxed text-foreground/90">{row.detail}</p>
                  <p className="mt-0.5 text-xs text-palette-neutral-500">Source: {row.source}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className={cn(sectionLabelClass, 'text-palette-success-700')}>Strong matches</p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground">{strengths.length ? strengths.map((row) => <li key={row.key}>{row.name}</li>) : <li className="text-muted-foreground">None yet</li>}</ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className={cn(sectionLabelClass, 'text-palette-danger-700')}>Gaps · evidence is weak</p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground">
            {gaps.length ? gaps.map((row) => <li key={row.key}>{row.name} <span className="text-xs text-muted-foreground">({displayStrength(row.strength)})</span></li>) : <li className="text-muted-foreground">None</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className={cn(sectionLabelClass, 'flex items-center gap-1 text-palette-warning-700')}>
            <CircleHelp className="h-3 w-3" aria-hidden="true" />
            Missing evidence · not negative
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground">{missing.length ? missing.map((row) => <li key={row.key}>{row.name}</li>) : <li className="text-muted-foreground">None</li>}</ul>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <p className={sectionLabelClass}>Proposed actions</p>
        <ul className="mt-2 space-y-2">
          {output.proposedActions.length === 0 && <li className="text-sm text-muted-foreground">No actions — the relevant actions are turned off in Configuration.</li>}
          {output.proposedActions.map((action) => (
            <li key={action.label} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-palette-neutral-900">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.reason}</p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                  action.requiresApproval ? 'bg-palette-brand-100 text-palette-brand-700' : 'bg-palette-neutral-150 text-palette-neutral-600',
                )}
              >
                {action.requiresApproval && <Hourglass className="h-3 w-3" aria-hidden="true" />}
                {action.requiresApproval ? 'Needs your approval' : 'Agent can do this'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-xs text-muted-foreground">Test mode: nothing is changed or sent. In live mode these appear in Approvals.</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <p className={cn(sectionLabelClass, 'flex items-center gap-1.5')}>
            <Database className="h-3 w-3" aria-hidden="true" />
            Information the agent used
          </p>
          <ul className="mt-2 space-y-1.5">
            {output.informationUsed.map((item) => (
              <li key={item.label} className="text-sm">
                <span className="font-medium text-palette-neutral-900">{item.label}</span>
                <span className="text-muted-foreground"> — {item.detail}</span>
              </li>
            ))}
          </ul>
          <p className={cn(sectionLabelClass, 'mt-3.5 flex items-center gap-1.5 border-t border-border pt-3')}>
            <Lock className="h-3 w-3" aria-hidden="true" />
            Not used
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {output.informationExcluded.map((item) => (
              <li key={item} className="text-xs text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-palette-warning-300 bg-palette-warning-100 p-5 shadow-xs">
          <p className={cn(sectionLabelClass, 'flex items-center gap-1.5 text-palette-warning-700')}>
            <CircleHelp className="h-3 w-3" aria-hidden="true" />
            Uncertainty &amp; missing evidence
          </p>
          {output.uncertainty.length ? (
            <ul className="mt-2 space-y-1.5">
              {output.uncertainty.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-foreground">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-foreground">Every configured criterion has evidence. No notable uncertainty.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function compareRows(previous: CandidateReviewOutput, current: CandidateReviewOutput) {
  const rows = [
    { label: 'Recommendation', before: previous.verdictLabel, after: current.verdictLabel },
    { label: 'Evidence fit', before: `${previous.fit}%`, after: `${current.fit}%` },
    { label: 'Coverage', before: `${previous.coverage}%`, after: `${current.coverage}%` },
    { label: 'Confidence', before: previous.confidence, after: current.confidence },
    { label: 'Proposed actions', before: previous.proposedActions.map((action) => action.label).join('; ') || '—', after: current.proposedActions.map((action) => action.label).join('; ') || '—' },
  ]
  for (const row of current.criteria) {
    const before = previous.criteria.find((entry) => entry.key === row.key)
    if (before && before.weight !== row.weight) rows.push({ label: `${row.name} weight`, before: String(before.weight), after: String(row.weight) })
  }
  return rows
}

function Comparison({ previous, current }: { previous: ReviewRun; current: ReviewRun }) {
  const rows = compareRows(previous.output, current.output)
  const added = current.output.refinementsApplied.filter((key) => !previous.output.refinementsApplied.includes(key))
  const removed = previous.output.refinementsApplied.filter((key) => !current.output.refinementsApplied.includes(key))
  const changed = rows.filter((row) => row.before !== row.after).length

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
        <GitCompareArrows className="h-4 w-4 text-palette-neutral-500" aria-hidden="true" />
        Run #{previous.runNumber} vs Run #{current.runNumber}
        <span className="text-xs font-normal text-muted-foreground">
          {changed === 0 ? 'No differences' : `${changed} difference${changed > 1 ? 's' : ''}`}
        </span>
      </h3>
      {(added.length > 0 || removed.length > 0) && (
        <p className="mt-1 text-xs text-muted-foreground">
          Instruction changes: {[...added.map((key) => `+ ${REFINEMENTS[key].label}`), ...removed.map((key) => `− ${REFINEMENTS[key].label}`)].join(' · ')}
        </p>
      )}
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">
            <th className="py-2 pr-3">Output</th>
            <th className="py-2 pr-3">Run #{previous.runNumber} · v{previous.configVersion}</th>
            <th className="py-2">Run #{current.runNumber} · v{current.configVersion}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const diff = row.before !== row.after
            return (
              <tr key={row.label} className="border-b border-border align-top last:border-0">
                <td className="py-2 pr-3 font-medium text-palette-neutral-700">{row.label}</td>
                <td className={cn('py-2 pr-3', diff ? 'text-muted-foreground line-through decoration-palette-neutral-400' : 'text-foreground')}>{row.before}</td>
                <td className={cn('py-2', diff ? 'font-semibold text-palette-neutral-900' : 'text-foreground')}>{row.after}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export function CandidateReviewStudio() {
  const record = useAgentStore((state) => state.agents['candidate-review'])
  const runs = useAgentStore((state) => state.reviewRuns)
  const recordReviewRun = useAgentStore((state) => state.recordReviewRun)
  const addRefinements = useAgentStore((state) => state.addRefinements)
  const pushToast = useAppStore((state) => state.pushToast)
  useAppStore((state) => state.criteriaVersion)
  const allCandidates = useAllEffectiveCandidates()
  const [searchParams] = useSearchParams()

  const assignable = openings.filter((opening) => record.config.openingIds.includes(opening.id))
  const [openingId, setOpeningId] = useState<OpeningId>(assignable[0]?.id ?? 'senior-product-designer')
  const pool = allCandidates.filter((candidate) => candidate.openingId === openingId && candidate.evidence.length > 0 && !candidate.rejected)
  const requested = searchParams.get('candidate')
  const [candidateId, setCandidateId] = useState<string>(pool.find((candidate) => candidate.id === requested)?.id ?? pool[0]?.id ?? '')
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [selected, setSelected] = useState<RefinementKey[]>([])
  const [feedback, setFeedback] = useState('')
  const [appliedSinceRun, setAppliedSinceRun] = useState(false)

  const candidateRuns = runs.filter((run) => run.output.candidateId === candidateId)
  const activeRun = runs.find((run) => run.id === activeRunId && run.output.candidateId === candidateId) ?? candidateRuns[candidateRuns.length - 1]
  const previousRun = activeRun ? [...candidateRuns].reverse().find((run) => run.runNumber < activeRun.runNumber) : undefined
  const candidate = pool.find((entry) => entry.id === candidateId)

  const run = () => {
    if (!candidate) return
    const output = runCandidateReview(candidate, openingId, record.config)
    const saved = recordReviewRun(output)
    setActiveRunId(saved.id)
    setAppliedSinceRun(false)
  }

  const applyFeedback = () => {
    const interpreted = interpretFeedback(feedback)
    const keys = [...new Set([...selected, ...interpreted])].filter((key) => !record.config.refinements.includes(key))
    const note = feedback.trim() && interpreted.length === 0 ? feedback.trim() : undefined
    if (keys.length === 0 && !note) {
      pushToast('Those refinements are already in the agent’s instructions.')
      return
    }
    addRefinements('candidate-review', keys, note)
    setSelected([])
    setFeedback('')
    setAppliedSinceRun(true)
    pushToast(
      keys.length
        ? `Instructions updated (v${record.version + 1}): ${keys.map((key) => REFINEMENTS[key].label.toLowerCase()).join('; ')}. Run the test again to compare.`
        : 'Recorded as a note. The simulation can’t interpret free text — pick a suggested refinement to change its behaviour.',
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <StepLabel step={1}>Select a job opening</StepLabel>
          <select
            aria-label="Job opening"
            className={cn(inputClass, 'mt-2')}
            value={openingId}
            onChange={(event) => {
              const next = event.target.value as OpeningId
              setOpeningId(next)
              setCandidateId(allCandidates.find((entry) => entry.openingId === next && entry.evidence.length > 0)?.id ?? '')
            }}
          >
            {assignable.map((opening) => (
              <option key={opening.id} value={opening.id}>
                {opening.title}
              </option>
            ))}
          </select>

          <StepLabel step={2} className="mt-4">
            Select a sample candidate
          </StepLabel>
          {pool.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">This opening has no candidates with recorded evidence in the prototype.</p>
          ) : (
            <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
              {pool.map((entry) => (
                <li key={entry.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm',
                      candidateId === entry.id ? 'border-primary bg-palette-brand-100/50' : 'border-transparent hover:bg-muted/60',
                    )}
                  >
                    <input type="radio" name="sample-candidate" checked={candidateId === entry.id} onChange={() => setCandidateId(entry.id)} className="accent-[var(--primary)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-palette-neutral-900">{entry.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.stage}
                        {entry.currentRole ? ` · ${entry.currentRole}` : ''}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <StepLabel step={3} className="mt-4">
            Run the agent
          </StepLabel>
          <button type="button" className={cn(primaryButtonClass, 'mt-2 w-full')} onClick={run} disabled={!candidate}>
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            {candidateRuns.length ? 'Run again' : 'Run test'}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Uses configuration v{record.version}. Nothing is changed or sent.</p>
        </section>

        {candidateRuns.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className={sectionLabelClass}>Runs for {candidate?.name.split(' ')[0]}</p>
            <ul className="mt-2 space-y-1">
              {[...candidateRuns].reverse().map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setActiveRunId(entry.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      activeRun?.id === entry.id ? 'bg-muted font-medium text-palette-neutral-900' : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    <span>
                      Run #{entry.runNumber} <span className="text-xs text-muted-foreground">v{entry.configVersion}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{entry.output.verdictLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        {!activeRun ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-palette-neutral-400 bg-card p-10 text-center">
            <Sparkles className="h-5 w-5 text-palette-neutral-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-palette-neutral-900">Pick a candidate and run the agent</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              You’ll see its evaluation, the evidence behind it, gaps versus missing evidence, what it would propose, and what information it used.
            </p>
          </div>
        ) : (
          <>
            {previousRun && <Comparison previous={previousRun} current={activeRun} />}
            <ReviewResult run={activeRun} />

            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-palette-neutral-900">Refine the agent</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Tell the agent what to do differently. Your feedback is added to its instructions; then run the test again to compare.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(REFINEMENTS) as RefinementKey[]).map((key) => {
                  const applied = record.config.refinements.includes(key)
                  const isSelected = selected.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={applied}
                      onClick={() => setSelected((current) => (isSelected ? current.filter((entry) => entry !== key) : [...current, key]))}
                      aria-pressed={isSelected}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                        applied
                          ? 'border-palette-success-300 bg-palette-success-150 text-palette-success-700'
                          : isSelected
                            ? 'border-primary bg-palette-brand-100 text-palette-brand-700'
                            : 'border-border text-palette-neutral-700 hover:bg-muted',
                      )}
                    >
                      {applied ? `✓ ${REFINEMENTS[key].label}` : REFINEMENTS[key].label}
                    </button>
                  )
                })}
              </div>
              <textarea
                aria-label="Feedback for the agent"
                rows={2}
                placeholder="Or write feedback, e.g. “Leadership should be a must-have for this role”"
                className={cn(inputClass, 'mt-3')}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className={secondaryButtonClass} onClick={applyFeedback} disabled={selected.length === 0 && !feedback.trim()}>
                  Apply to instructions
                </button>
                {appliedSinceRun && (
                  <button type="button" className={primaryButtonClass} onClick={run}>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Run again to compare
                  </button>
                )}
                <Link to="/agents/candidate-review/configure" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-palette-brand-600">
                  View in Configuration
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
