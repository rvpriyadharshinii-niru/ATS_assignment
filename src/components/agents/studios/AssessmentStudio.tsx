import { CheckCircle2, CircleAlert, Pencil, Play, Plus, Sparkles, Trash } from 'lucide-react'
import { useState } from 'react'
import { inputClass, primaryButtonClass, secondaryButtonClass, sectionLabelClass } from '../../../agents/display'
import { assessmentTitle, checkAssessment, generateAssessment, summariseAssessment } from '../../../agents/simulate'
import { getCriteria } from '../../../data/criteria'
import { openings } from '../../../data/openings'
import { cn } from '../../../lib/cn'
import { useAllEffectiveCandidates } from '../../../store/candidateSelectors'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAppStore } from '../../../store/useAppStore'
import type { AssessmentQuestion, AssessmentResult, AssessmentType, Seniority } from '../../../types/agents'
import type { CriterionKey, OpeningId } from '../../../types/domain'
import { SimulatedTag } from '../agentUi'
import { AssessmentResultView } from '../AssessmentResultView'
import { StepLabel } from './studioUi'

const TYPES: { key: AssessmentType; description: string }[] = [
  { key: 'Technical', description: 'Written reasoning about design problems' },
  { key: 'Practical', description: 'A short take-home exercise' },
  { key: 'Role-specific', description: 'Structured discussion and portfolio walkthroughs' },
]

const SENIORITIES: Seniority[] = ['Mid-level', 'Senior', 'Lead']

let customCounter = 0

function QuestionCard({
  question,
  index,
  openingId,
  editing,
  onEdit,
  onChange,
  onRemove,
}: {
  question: AssessmentQuestion
  index: number
  openingId: OpeningId
  editing: boolean
  onEdit: (editing: boolean) => void
  onChange: (next: AssessmentQuestion) => void
  onRemove: () => void
}) {
  const criteria = getCriteria(openingId)
  const criterionName = criteria.find((criterion) => criterion.key === question.criterionKey)?.name

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-palette-neutral-900">Q{index + 1}</span>
          {editing ? (
            <select
              aria-label="Linked requirement"
              value={question.criterionKey ?? ''}
              onChange={(event) => onChange({ ...question, criterionKey: (event.target.value || undefined) as CriterionKey | undefined })}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs focus:border-primary focus:outline-none"
            >
              <option value="">Not linked to a requirement</option>
              {criteria.map((criterion) => (
                <option key={criterion.key} value={criterion.key}>
                  {criterion.name}
                </option>
              ))}
            </select>
          ) : criterionName ? (
            <span className="rounded-full bg-palette-neutral-150 px-2 py-0.5 font-medium text-palette-neutral-700">{criterionName}</span>
          ) : (
            <span className="rounded-full bg-palette-warning-150 px-2 py-0.5 font-medium text-palette-warning-700">Not linked to a requirement</span>
          )}
          <span className="text-muted-foreground">{question.format}</span>
          {editing ? (
            <label className="flex items-center gap-1 text-muted-foreground">
              <input
                type="number"
                min={5}
                max={90}
                step={5}
                aria-label="Minutes"
                value={question.minutes}
                onChange={(event) => onChange({ ...question, minutes: Number(event.target.value) || 0 })}
                className="w-14 rounded-md border border-border bg-card px-1.5 py-0.5 text-xs"
              />
              min
            </label>
          ) : (
            <span className="text-muted-foreground">{question.minutes} min</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(!editing)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {editing ? (
              'Done'
            ) : (
              <>
                <Pencil className="h-3 w-3" aria-hidden="true" />
                Edit
              </>
            )}
          </button>
          <button
            type="button"
            aria-label={`Remove question ${index + 1}`}
            onClick={onRemove}
            className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-2.5 space-y-2">
          <textarea aria-label="Question" rows={3} className={inputClass} value={question.prompt} placeholder="Write the question…" onChange={(event) => onChange({ ...question, prompt: event.target.value })} />
          <textarea
            aria-label="What good looks like"
            rows={2}
            className={cn(inputClass, 'text-xs')}
            value={question.lookFor}
            placeholder="What good looks like…"
            onChange={(event) => onChange({ ...question, lookFor: event.target.value })}
          />
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-palette-neutral-900">{question.prompt || <span className="text-muted-foreground">No question text yet.</span>}</p>
          {question.lookFor && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-palette-neutral-700">What good looks like: </span>
              {question.lookFor}
            </p>
          )}
        </>
      )}
    </li>
  )
}

export function AssessmentStudio() {
  const record = useAgentStore((state) => state.agents.assessment)
  const draft = useAgentStore((state) => state.assessmentDraft)
  const setAssessmentDraft = useAgentStore((state) => state.setAssessmentDraft)
  const approveAssessmentDraft = useAgentStore((state) => state.approveAssessmentDraft)
  const pushToast = useAppStore((state) => state.pushToast)
  useAppStore((state) => state.criteriaVersion)
  const allCandidates = useAllEffectiveCandidates()

  const assignable = openings.filter((opening) => record.config.openingIds.includes(opening.id))
  const [openingId, setOpeningId] = useState<OpeningId>(draft.openingId)
  const [type, setType] = useState<AssessmentType>(draft.type)
  const [seniority, setSeniority] = useState<Seniority>(draft.seniority)
  const criteria = getCriteria(openingId)
  const [skills, setSkills] = useState<CriterionKey[]>(draft.criteria)
  const [editingId, setEditingId] = useState<string | null>(null)
  const samplePool = allCandidates.filter((candidate) => candidate.openingId === openingId && candidate.evidence.length > 0 && !candidate.rejected)
  const [sampleId, setSampleId] = useState<string>(samplePool.find((candidate) => candidate.id === 'kavya-iyer')?.id ?? samplePool[0]?.id ?? '')
  const [preview, setPreview] = useState<AssessmentResult | null>(null)

  const checks = checkAssessment(draft, draft.openingId)
  const blocking = checks.filter((check) => !check.ok && (check.label.startsWith('No questions about') || check.label.startsWith('Questions are complete')))
  const totalMinutes = draft.questions.reduce((sum, question) => sum + question.minutes, 0)
  const approved = draft.approvedVersion !== undefined && !draft.editedSinceApproval

  const updateQuestions = (questions: AssessmentQuestion[]) => {
    setAssessmentDraft({ ...draft, questions })
    setPreview(null)
  }

  const generate = () => {
    setAssessmentDraft(generateAssessment(openingId, type, seniority, skills))
    setEditingId(null)
    setPreview(null)
    pushToast(`Draft ${type.toLowerCase()} assessment generated. Review and edit before approving.`)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <section className="space-y-4 self-start rounded-xl border border-border bg-card p-4 shadow-xs">
        <div>
          <StepLabel step={1}>Job opening</StepLabel>
          <select aria-label="Job opening" className={cn(inputClass, 'mt-2')} value={openingId} onChange={(event) => setOpeningId(event.target.value as OpeningId)}>
            {assignable.map((opening) => (
              <option key={opening.id} value={opening.id}>
                {opening.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <StepLabel step={2}>Assessment type</StepLabel>
          <div className="mt-2 space-y-1" role="radiogroup" aria-label="Assessment type">
            {TYPES.map((entry) => (
              <label
                key={entry.key}
                className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2', type === entry.key ? 'border-primary bg-palette-brand-100/50' : 'border-transparent hover:bg-muted/60')}
              >
                <input type="radio" name="assessment-type" checked={type === entry.key} onChange={() => setType(entry.key)} className="mt-0.5 accent-[var(--primary)]" />
                <span>
                  <span className="block text-sm font-medium text-palette-neutral-900">{entry.key}</span>
                  <span className="block text-xs text-muted-foreground">{entry.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <StepLabel step={3}>Seniority</StepLabel>
          <select aria-label="Seniority" className={cn(inputClass, 'mt-2')} value={seniority} onChange={(event) => setSeniority(event.target.value as Seniority)}>
            {SENIORITIES.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>
        <div>
          <StepLabel step={4}>Skills to assess</StepLabel>
          {criteria.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No hiring criteria are configured for this opening.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {criteria.map((criterion) => (
                <li key={criterion.key}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={skills.includes(criterion.key)}
                      onChange={(event) => setSkills((current) => (event.target.checked ? [...current, criterion.key] : current.filter((key) => key !== criterion.key)))}
                      className="accent-[var(--primary)]"
                    />
                    <span className="min-w-0 flex-1 truncate text-palette-neutral-900">{criterion.name}</span>
                    <span className="text-xs text-muted-foreground">{criterion.priority}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className={cn(primaryButtonClass, 'w-full')} onClick={generate} disabled={skills.length === 0}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Generate draft
        </button>
        <p className="text-xs text-muted-foreground">Generating replaces the current draft. Nothing is sent to candidates.</p>
      </section>

      <div className="min-w-0 space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide text-primary">Draft assessment</span>
                <SimulatedTag />
              </p>
              <h3 className="mt-1 text-base font-semibold text-palette-neutral-900">{assessmentTitle(draft)}</h3>
              <p className="text-sm text-muted-foreground">
                {draft.questions.length} questions · {totalMinutes} minutes
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  approved ? 'bg-palette-success-150 text-palette-success-700' : draft.approvedVersion ? 'bg-palette-warning-150 text-palette-warning-700' : 'bg-palette-neutral-150 text-palette-neutral-600',
                )}
              >
                {approved ? `Approved · v${draft.approvedVersion}` : draft.approvedVersion ? 'Edited since approval' : 'Not yet approved'}
              </span>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={approved || blocking.length > 0}
                title={blocking.length ? 'Resolve the blocking quality checks first' : undefined}
                onClick={() => {
                  approveAssessmentDraft()
                  setEditingId(null)
                  pushToast('Assessment approved as the template. Sending it to a candidate still needs your approval each time.')
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {approved ? 'Approved' : 'Approve questions'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Approving saves this as the template. Publishing it to any candidate is a separate step that always waits for your approval.</p>
        </section>

        <ul className="space-y-3">
          {draft.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              openingId={draft.openingId}
              editing={editingId === question.id}
              onEdit={(editing) => setEditingId(editing ? question.id : null)}
              onChange={(next) => updateQuestions(draft.questions.map((entry) => (entry.id === question.id ? next : entry)))}
              onRemove={() => updateQuestions(draft.questions.filter((entry) => entry.id !== question.id))}
            />
          ))}
        </ul>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            customCounter += 1
            const id = `q-custom-${Date.now()}-${customCounter}`
            updateQuestions([...draft.questions, { id, format: 'Structured discussion', minutes: 15, prompt: '', lookFor: '' }])
            setEditingId(id)
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add question
        </button>

        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <p className={sectionLabelClass}>Quality checks</p>
          <ul className="mt-2 space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2">
                {check.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-palette-success-600" aria-label="Passed" />
                ) : (
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-palette-warning-600" aria-label="Needs attention" />
                )}
                <div>
                  <p className="text-sm font-medium text-palette-neutral-900">{check.label}</p>
                  <p className={cn('text-xs', check.ok ? 'text-muted-foreground' : 'text-palette-warning-700')}>{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-palette-neutral-900">Test the output</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Preview how the agent would summarise a submission. The sample response is simulated from the candidate’s recorded evidence.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select aria-label="Sample candidate" className={cn(inputClass, 'max-w-xs')} value={sampleId} onChange={(event) => setSampleId(event.target.value)}>
              {samplePool.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} · {candidate.stage}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={!sampleId || draft.questions.length === 0}
              onClick={() => {
                const candidate = samplePool.find((entry) => entry.id === sampleId)
                if (candidate) setPreview(summariseAssessment(draft, candidate, assessmentTitle(draft)))
              }}
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Preview results summary
            </button>
          </div>
          {preview && (
            <div className="mt-4">
              <AssessmentResultView result={preview} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
