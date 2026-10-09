import { CalendarClock, CheckCircle2, FileX } from 'lucide-react'
import { getSourceDocuments } from '../../../data/sources'
import { deriveInterviewDayLabel, deriveInterviewType } from '../../../lib/candidateStatus'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { WorkspaceTask } from '../../../types/workspace'
import { criterionName, firstName, gapCriteria, midSentence } from '../../../workspace/derive'
import { btn } from '../styles'

export function InterviewPrepView({ task, candidateIds }: { task: WorkspaceTask; candidateIds: string[] }) {
  const all = useAllEffectiveCandidates()
  const send = useWorkspaceStore((state) => state.send)
  const setView = useWorkspaceStore((state) => state.setView)
  const savedGuides = useWorkspaceStore((state) => state.savedGuides)
  const people = candidateIds.map((id) => all.find((candidate) => candidate.id === id)).filter((c) => !!c)

  return (
    <ul className="space-y-3">
      {people.map((candidate) => {
        const { dayLabel, time } = deriveInterviewDayLabel(candidate)
        const hasDocs = getSourceDocuments(candidate.id).length > 0
        const saved = savedGuides[candidate.id]
        const draft = task.guides[candidate.id]
        const gaps = gapCriteria(candidate).filter((gap) => gap.kind !== 'partial')
        return (
          <li key={candidate.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start gap-3">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-palette-neutral-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</p>
                <p className="text-xs text-palette-neutral-600">
                  {deriveInterviewType(candidate)} · {dayLabel}, {time}
                </p>
                {hasDocs ? (
                  <p className="mt-1.5 text-sm text-palette-neutral-700">
                    {gaps.length ? `Focus: validate ${gaps.map((gap) => midSentence(criterionName(candidate, gap.key))).join(' and ')}.` : 'Evidence covers every criterion; go deeper on ownership.'}
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-palette-warning-700">
                    <FileX className="h-4 w-4" aria-hidden="true" />
                    No resume on file. Only the standard question set is possible.
                  </p>
                )}
              </div>
              {saved ? (
                <button type="button" className={btn.secondary} onClick={() => setView(task.id, { type: 'interview-guide', candidateId: candidate.id })}>
                  <CheckCircle2 className="h-4 w-4 text-palette-success-600" aria-hidden="true" />
                  Guide saved
                </button>
              ) : hasDocs ? (
                <button type="button" className={btn.primary} onClick={() => (draft ? setView(task.id, { type: 'interview-guide', candidateId: candidate.id }) : send(task.id, `Prepare interview questions for ${candidate.name}`))}>
                  {draft ? 'Continue guide' : `Prepare ${firstName(candidate)}'s guide`}
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
