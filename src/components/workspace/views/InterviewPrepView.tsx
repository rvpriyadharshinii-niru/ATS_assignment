import { CalendarClock, CheckCircle2, CircleAlert, FileText, FileX, Hourglass, ListChecks } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { ActivityCard } from '../../agents/AgentActivityList'
import { getInterviewFeedback } from '../../../data/interviewFeedback'
import { getOpening } from '../../../data/openings'
import { getSourceDocuments } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { deriveInterviewDayLabel, deriveInterviewType } from '../../../lib/candidateStatus'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore } from '../../../store/useAgentStore'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { WorkspaceTask } from '../../../types/workspace'
import { criterionName, firstName, gapCriteria, midSentence } from '../../../workspace/derive'
import { Avatar } from '../ui'
import { btn } from '../styles'

const OPEN = ['pending', 'needs-review', 'failed']

function Row({ icon: Icon, tone, label, children }: { icon: ComponentType<{ className?: string }>; tone: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[150px_1fr]">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-palette-neutral-650">
        <Icon className={cn('h-3.5 w-3.5', tone)} aria-hidden="true" />
        {label}
      </p>
      <div className="min-w-0 text-sm text-palette-neutral-800">{children}</div>
    </div>
  )
}

/**
 * "Prepare my upcoming interviews" as one prepared pack: for each interview it shows what was drafted,
 * which information it used, what is missing, and anything (from the coordination agent) waiting on you.
 */
export function InterviewPrepView({ task, candidateIds }: { task: WorkspaceTask; candidateIds: string[] }) {
  const all = useAllEffectiveCandidates()
  const setView = useWorkspaceStore((state) => state.setView)
  const saveGuide = useWorkspaceStore((state) => state.saveGuide)
  const savedGuides = useWorkspaceStore((state) => state.savedGuides)
  const activity = useAgentStore((state) => state.activity)
  const people = candidateIds.map((id) => all.find((candidate) => candidate.id === id)).filter((c) => !!c)

  const rows = people.map((candidate) => {
    const docs = getSourceDocuments(candidate.id)
    const open = activity.filter((item) => item.candidateId === candidate.id && OPEN.includes(item.status))
    return { candidate, docs, open, saved: !!savedGuides[candidate.id], draft: task.guides[candidate.id] }
  })
  const done = rows.filter((row) => row.saved).length
  const toReview = rows.filter((row) => !row.saved && row.draft).length
  const missing = rows.filter((row) => !row.docs.length).length
  const approvals = rows.reduce((sum, row) => sum + row.open.length, 0)
  const unsaved = rows.filter((row) => !row.saved && row.draft)

  const summary = [
    { label: 'Guides to review', value: toReview, tone: 'border-palette-brand-200 bg-palette-brand-100/60 text-palette-brand-800' },
    { label: 'Needs you', value: approvals, tone: approvals ? 'border-palette-warning-300 bg-palette-warning-100 text-palette-warning-800' : 'border-border bg-card text-palette-neutral-700' },
    { label: 'Missing information', value: missing, tone: missing ? 'border-palette-warning-250 bg-palette-warning-100/60 text-palette-warning-800' : 'border-border bg-card text-palette-neutral-700' },
    { label: 'Saved for the panel', value: done, tone: 'border-palette-success-250 bg-palette-success-100/70 text-palette-success-800' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className={cn('rounded-xl border px-4 py-3', item.tone)}>
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
            <p className="text-xs font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {unsaved.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <ListChecks className="h-4 w-4 text-palette-brand-600" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-palette-neutral-700">Happy with the drafts? Save them all to the candidates' profiles for the panel.</p>
          <button type="button" className={btn.secondary} onClick={() => unsaved.forEach((row) => saveGuide(task.id, row.candidate.id))}>
            Save {unsaved.length} guides
          </button>
        </div>
      )}

      <ul className="space-y-4">
        {rows.map(({ candidate, docs, open, saved, draft }) => {
          const { dayLabel, time } = deriveInterviewDayLabel(candidate)
          const gaps = gapCriteria(candidate).filter((gap) => gap.kind !== 'partial')
          const feedback = getInterviewFeedback(candidate.id)
          const questions = draft?.sections.reduce((sum, section) => sum + section.questions.length, 0) ?? 0
          return (
            <li key={candidate.id} className="rounded-xl border border-border bg-card shadow-xs">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                <Avatar name={candidate.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-palette-neutral-900">{candidate.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-palette-neutral-600">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    {getOpening(candidate.openingId)?.title} · {deriveInterviewType(candidate)} · {dayLabel}, {time}
                  </p>
                </div>
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-palette-success-150 px-2.5 py-1 text-xs font-semibold text-palette-success-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ready
                  </span>
                ) : open.length ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-palette-warning-150 px-2.5 py-1 text-xs font-semibold text-palette-warning-800">
                    <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                    Needs you
                  </span>
                ) : null}
              </div>
              <div className="divide-y divide-border px-5">
                <Row icon={FileText} tone="text-palette-brand-500" label="Interview guide">
                  {docs.length ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="min-w-0 flex-1">
                        {saved
                          ? 'Saved to the profile for the panel.'
                          : draft
                            ? `Drafted: ${draft.minutes} minutes, ${questions} questions${gaps.length ? `, focused on ${gaps.map((gap) => midSentence(criterionName(candidate, gap.key))).join(' and ')}` : ''}.`
                            : 'Not drafted yet.'}
                      </span>
                      <button type="button" className={saved ? btn.ghost : btn.primary} onClick={() => setView(task.id, { type: 'interview-guide', candidateId: candidate.id })}>
                        {saved ? 'Open guide' : 'Review and edit'}
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-palette-warning-700">
                      <FileX className="h-4 w-4 shrink-0" aria-hidden="true" />
                      No resume on file, so a tailored guide isn't possible. Use the role's standard questions, or ask {firstName(candidate)} for a resume.
                    </span>
                  )}
                </Row>
                <Row icon={ListChecks} tone="text-palette-info-500" label="Information used">
                  {docs.length ? docs.map((doc) => doc.title).join(', ') : 'Application summary only'}
                  {feedback.length ? ` · ${feedback.length} earlier scorecards` : ''} · 5 job criteria
                </Row>
                {open.length > 0 ? (
                  <div className="space-y-2 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-palette-warning-700">
                      <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      Before the interview
                    </p>
                    {open.map((item) => (
                      <ActivityCard key={item.id} item={item} showAgent />
                    ))}
                  </div>
                ) : (
                  <Row icon={CheckCircle2} tone="text-palette-success-600" label="Schedule">
                    No conflicts found for the panel.
                  </Row>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-palette-neutral-550">Guides stay in this task until you save them. Nothing is shared with the panel or sent to candidates without you.</p>
    </div>
  )
}
