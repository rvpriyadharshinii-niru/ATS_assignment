import { ArrowUp, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { getCriteria } from '../../../data/criteria'
import { getEvidenceSource } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { STRENGTH_RANK } from '../../../lib/evidence'
import { STAGE_TONE } from '../../../lib/stageTone'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { Candidate } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { evidenceFor, firstName, gapCriteria, midSentence, supportedCount } from '../../../workspace/derive'
import { RecommendationBadge } from '../../candidates/RecommendationBadge'
import { DecisionBar } from '../DecisionBar'
import { Avatar, CitationChip, StrengthPill } from '../ui'
import { btn } from '../styles'

export function ComparisonWorkspaceView({ task, candidateIds }: { task: WorkspaceTask; candidateIds: string[] }) {
  const all = useAllEffectiveCandidates()
  const setView = useWorkspaceStore((state) => state.setView)
  const focusCriterion = useWorkspaceStore((state) => state.focusCriterion)
  const focusCandidate = useWorkspaceStore((state) => state.focusCandidate)
  const send = useWorkspaceStore((state) => state.send)
  const own = useWorkspaceStore((state) => state.managerAssessments)
  const [onlyDifferences, setOnlyDifferences] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const people = candidateIds.map((id) => all.find((candidate) => candidate.id === id)).filter((c): c is Candidate => !!c)
  if (people.length < 2) return null
  const criteria = getCriteria(people[0].openingId)
  const rankOf = (candidate: Candidate, key: (typeof criteria)[number]['key']) => STRENGTH_RANK[evidenceFor(candidate, key)?.strength ?? 'Not available']
  const differs = (key: (typeof criteria)[number]['key']) => new Set(people.map((candidate) => rankOf(candidate, key))).size > 1
  const rows = onlyDifferences ? criteria.filter((criterion) => differs(criterion.key)) : criteria
  const addable = all.filter((candidate) => candidate.openingId === people[0].openingId && candidate.evidence.length > 0 && !candidate.rejected && !candidateIds.includes(candidate.id))

  const openSource = (candidate: Candidate, key: (typeof criteria)[number]['key']) => {
    const source = getEvidenceSource(candidate.id, key)
    focusCriterion(task.id, candidate.id, key)
    setView(task.id, { type: 'source', candidateId: candidate.id, passageIds: [...source.passageIds, ...(source.conflict?.passageIds ?? [])], criterionKey: key })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="inline-flex items-center gap-2 text-palette-neutral-700">
          <input type="checkbox" checked={onlyDifferences} onChange={(event) => setOnlyDifferences(event.target.checked)} className="h-4 w-4" />
          Only where they differ
        </label>
        <label className="inline-flex items-center gap-2 text-palette-neutral-700">
          <input type="checkbox" checked={expanded} onChange={(event) => setExpanded(event.target.checked)} className="h-4 w-4" />
          Show full evidence
        </label>
        <span className="ml-auto text-xs text-palette-neutral-550">No overall winner · select a cell to open its source</span>
      </div>

      <div className="max-h-[75vh] overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-44 bg-card shadow-[inset_0_-1px_0_var(--border)] px-4 py-3 align-bottom text-xs font-semibold text-palette-neutral-600">Criterion</th>
              {people.map((candidate) => (
                <th key={candidate.id} className={cn('sticky top-0 z-10 px-4 py-3 align-top shadow-[inset_0_-1px_0_var(--border)]', task.focusCandidateId === candidate.id ? 'bg-palette-neutral-100' : 'bg-card')}>
                  <div className="flex items-start gap-2">
                    <Avatar name={candidate.name} size="sm" />
                    <button type="button" onClick={() => focusCandidate(task.id, candidate.id)} className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-semibold text-palette-neutral-900 hover:text-palette-brand-700">{candidate.name}</span>
                      <span className="block truncate text-xs font-normal text-palette-neutral-550">{[candidate.currentRole, candidate.currentCompany].filter(Boolean).join(' · ')}</span>
                    </button>
                    {people.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Remove ${candidate.name} from comparison`}
                        onClick={() => setView(task.id, { type: 'comparison', candidateIds: candidateIds.filter((id) => id !== candidate.id) })}
                        className="rounded p-0.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-700"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 font-normal">
                    {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
                    <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium', STAGE_TONE[candidate.stage])}>{candidate.stage}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={people.length + 1} className="px-4 py-6 text-center text-sm text-palette-neutral-550">
                  Their evidence is rated the same on every criterion.
                </td>
              </tr>
            )}
            {rows.map((criterion) => {
              const top = Math.max(...people.map((candidate) => STRENGTH_RANK[evidenceFor(candidate, criterion.key)?.strength ?? 'Not available']))
              const leaders = people.filter((candidate) => STRENGTH_RANK[evidenceFor(candidate, criterion.key)?.strength ?? 'Not available'] === top)
              return (
                <tr key={criterion.key} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-[1] bg-card px-4 py-3 align-top">
                    <p className="text-sm font-medium text-palette-neutral-900">{criterion.name}</p>
                    <p className="text-xs text-palette-neutral-500">{criterion.priority}</p>
                  </td>
                  {people.map((candidate) => {
                    const evidence = evidenceFor(candidate, criterion.key)
                    const source = getEvidenceSource(candidate.id, criterion.key)
                    const mine = own[candidate.id]?.[criterion.key]
                    const leads = leaders.length < people.length && leaders.includes(candidate) && top >= STRENGTH_RANK.Good
                    return (
                      <td key={candidate.id} className="px-4 py-3 align-top">
                        <button type="button" onClick={() => openSource(candidate, criterion.key)} className="w-full text-left">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <StrengthPill strength={evidence?.strength ?? 'Not available'} />
                            {mine && <span className="rounded-md border border-palette-brand-250 px-1.5 py-0.5 text-[11px] font-semibold text-palette-brand-700">You: {mine.strength}</span>}
                            {leads && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-palette-success-700">
                                <ArrowUp className="h-3 w-3" aria-hidden="true" />
                                Stronger here
                              </span>
                            )}
                          </span>
                          <span className={cn('mt-1.5 block text-[13px] leading-snug text-palette-neutral-600 hover:text-palette-neutral-900', !expanded && 'line-clamp-2')} title={expanded ? undefined : evidence?.detail}>
                            {evidence?.detail ?? 'No evidence recorded.'}
                          </span>
                        </button>
                        <div className={cn('mt-1.5 flex flex-wrap gap-1', !expanded && !source.conflict && 'hidden @3xl:flex')}>
                          {source.passageIds.slice(0, 2).map((id) => (
                            <CitationChip key={id} passageId={id} onOpen={() => openSource(candidate, criterion.key)} />
                          ))}
                          {source.conflict?.passageIds.map((id) => <CitationChip key={id} passageId={id} conflict onOpen={() => openSource(candidate, criterion.key)} />)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="border-t border-border bg-palette-neutral-100">
              <td className="sticky left-0 z-[1] bg-palette-neutral-100 px-4 py-3 align-top text-xs font-semibold text-palette-neutral-600">Summary</td>
              {people.map((candidate) => {
                const gaps = gapCriteria(candidate).filter((gap) => gap.kind !== 'partial')
                return (
                  <td key={candidate.id} className="px-4 py-3 align-top text-xs text-palette-neutral-700">
                    <p>{supportedCount(candidate)} of {criteria.length} criteria supported</p>
                    <p className="mt-0.5">{gaps.length ? `To validate: ${gaps.map((gap) => criteria.find((c) => c.key === gap.key)?.name ?? '').map(midSentence).join(', ')}` : 'No gaps found'}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button type="button" className={btn.chip} onClick={() => send(task.id, `Why ${firstName(candidate)}?`)}>
                        Why {firstName(candidate)}?
                      </button>
                      {gaps.length > 0 && (
                        <button type="button" className={btn.chip} onClick={() => send(task.id, `Prepare questions to validate the gaps for ${firstName(candidate)}`)}>
                          Questions for gaps
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 @2xl:grid-cols-2">
        {people.map((candidate) => (
          <div key={candidate.id} className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold text-palette-neutral-900">{candidate.name}</p>
            <DecisionBar task={task} candidate={candidate} compact />
          </div>
        ))}
      </div>

      {people.length < 3 && addable.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-palette-neutral-700">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add to comparison
          <select
            value=""
            onChange={(event) => event.target.value && setView(task.id, { type: 'comparison', candidateIds: [...candidateIds, event.target.value] })}
            className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
          >
            <option value="">Choose a candidate…</option>
            {addable.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} · {candidate.stage}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
