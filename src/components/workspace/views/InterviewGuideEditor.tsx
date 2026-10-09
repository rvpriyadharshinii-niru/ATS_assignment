import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { getCandidate } from '../../../data/candidates'
import { getEvidenceSource } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { GuideDraft, GuideSection, WorkspaceTask } from '../../../types/workspace'
import { buildGuideDraft } from '../../../workspace/derive'
import { CitationChip, Label } from '../ui'
import { btn, inputBase, relativeTime } from '../styles'

let questionCounter = 0

/** An editable, evidence-linked interview guide. AI drafts it; the manager owns every word before saving. */
export function InterviewGuideEditor({ task, candidateId, compact = false }: { task: WorkspaceTask; candidateId: string; compact?: boolean }) {
  const candidate = getCandidate(candidateId)
  const updateGuide = useWorkspaceStore((state) => state.updateGuide)
  const saveGuide = useWorkspaceStore((state) => state.saveGuide)
  const setView = useWorkspaceStore((state) => state.setView)
  const focusCriterion = useWorkspaceStore((state) => state.focusCriterion)
  const guide = task.guides[candidateId] ?? (candidate ? buildGuideDraft(candidate, { gapsOnly: true }) : undefined)
  if (!candidate || !guide) return null

  const write = (next: GuideDraft) => updateGuide(task.id, candidateId, { ...next, savedAt: undefined })
  const patchSection = (sectionId: string, patch: (section: GuideSection) => GuideSection) => write({ ...guide, sections: guide.sections.map((section) => (section.id === sectionId ? patch(section) : section)) })
  const questionCount = guide.sections.reduce((sum, section) => sum + section.questions.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-palette-neutral-900">
            {guide.roundType} · {candidate.name}
          </p>
          <p className="text-xs text-palette-neutral-550">
            {guide.minutes} minutes · {questionCount} questions · {guide.edited ? 'edited by you' : 'AI draft, not yet edited'}
          </p>
        </div>
        {guide.savedAt ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-palette-success-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Saved {relativeTime(guide.savedAt)}
          </span>
        ) : (
          !compact && (
            <button type="button" className={btn.primary} onClick={() => saveGuide(task.id, candidateId)}>
              Save for the interview
            </button>
          )
        )}
      </div>

      {guide.sections.map((section) => (
        <section key={section.id} className={cn('rounded-xl border bg-card p-4', section.kind === 'validate' ? 'border-palette-warning-300' : 'border-border')}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                section.kind === 'validate' ? 'bg-palette-warning-150 text-palette-warning-700' : section.kind === 'explore' ? 'bg-palette-info-150 text-palette-info-700' : 'bg-palette-neutral-200 text-palette-neutral-700',
              )}
            >
              {section.kind === 'validate' ? 'Validate' : section.kind === 'explore' ? 'Go deeper' : 'Everyone'}
            </span>
            <p className="text-sm font-semibold text-palette-neutral-900">{section.title}</p>
          </div>
          <p className="mt-1 text-xs text-palette-neutral-600">{section.why}</p>
          {section.evidence && (
            <div className="mt-2 rounded-lg bg-palette-neutral-100 px-3 py-2 text-xs text-palette-neutral-700">
              <span className="font-semibold">Evidence so far:</span> {section.evidence}
              {section.passageIds.length > 0 && section.criterionKey && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {section.passageIds.map((id) => (
                    <CitationChip
                      key={id}
                      passageId={id}
                      onOpen={() => {
                        const source = getEvidenceSource(candidateId, section.criterionKey!)
                        focusCriterion(task.id, candidateId, section.criterionKey!)
                        setView(task.id, { type: 'source', candidateId, passageIds: [...source.passageIds, ...(source.conflict?.passageIds ?? [])], criterionKey: section.criterionKey })
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <ol className="mt-3 space-y-2">
            {section.questions.map((question, index) => (
              <li key={question.id} className="flex items-start gap-2">
                <span className="mt-2 w-4 shrink-0 text-xs font-semibold text-palette-neutral-500">{index + 1}.</span>
                <textarea
                  value={question.text}
                  rows={2}
                  aria-label={`Question ${index + 1} for ${section.title}`}
                  onChange={(event) => patchSection(section.id, (current) => ({ ...current, questions: current.questions.map((q) => (q.id === question.id ? { ...q, text: event.target.value } : q)) }))}
                  className={cn(inputBase, 'min-h-[44px] resize-y text-[13px]')}
                />
                <button
                  type="button"
                  aria-label="Remove question"
                  onClick={() => patchSection(section.id, (current) => ({ ...current, questions: current.questions.filter((q) => q.id !== question.id) }))}
                  className="mt-1.5 rounded p-1 text-palette-neutral-400 hover:bg-muted hover:text-palette-danger-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              questionCounter += 1
              patchSection(section.id, (current) => ({ ...current, questions: [...current.questions, { id: `q-added-${questionCounter}`, text: '' }] }))
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-palette-brand-600 hover:text-palette-brand-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add question
          </button>
          <label className="mt-3 block">
            <Label>Listen for</Label>
            <input
              value={section.listenFor}
              onChange={(event) => patchSection(section.id, (current) => ({ ...current, listenFor: event.target.value }))}
              className={cn(inputBase, 'mt-1 text-[13px]')}
            />
          </label>
        </section>
      ))}

      {guide.rubric.length > 0 && !compact && (
        <section className="overflow-x-auto rounded-xl border border-border bg-card">
          <p className="px-4 pt-3 text-sm font-semibold text-palette-neutral-900">Suggested scoring rubric</p>
          <p className="px-4 text-xs text-palette-neutral-550">For the interviewer's own judgement. Score what the candidate shows, not the AI's earlier rating.</p>
          <table className="mt-2 w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-y border-border bg-palette-neutral-100 text-palette-neutral-600">
                <th className="px-4 py-2 font-semibold">Criterion</th>
                <th className="px-4 py-2 font-semibold">Strong</th>
                <th className="px-4 py-2 font-semibold">Mixed</th>
                <th className="px-4 py-2 font-semibold">Weak</th>
              </tr>
            </thead>
            <tbody>
              {guide.rubric.map((row) => (
                <tr key={row.criterion} className="border-b border-border last:border-0 align-top text-palette-neutral-700">
                  <td className="px-4 py-2 font-medium text-palette-neutral-900">{row.criterion}</td>
                  <td className="px-4 py-2">{row.strong}</td>
                  <td className="px-4 py-2">{row.mixed}</td>
                  <td className="px-4 py-2">{row.weak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!compact && !guide.savedAt && (
        <div className="flex justify-end">
          <button type="button" className={btn.primary} onClick={() => saveGuide(task.id, candidateId)}>
            Save for the interview
          </button>
        </div>
      )}
    </div>
  )
}
