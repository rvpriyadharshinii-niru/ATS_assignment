import { CheckCircle2, CircleAlert, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assessmentTitle, checkAssessment } from '../../../agents/simulate'
import { getCriteria } from '../../../data/criteria'
import { cn } from '../../../lib/cn'
import { useAgentStore } from '../../../store/useAgentStore'
import type { CriterionKey, OpeningId } from '../../../types/domain'
import { Label } from '../ui'
import { btn, inputBase } from '../styles'

let added = 0

/** Edits the same assessment draft the Assessment agent uses, so the workspace and the agent never diverge. */
export function AssessmentView({ openingId }: { openingId: OpeningId }) {
  const draft = useAgentStore((state) => state.assessmentDraft)
  const setDraft = useAgentStore((state) => state.setAssessmentDraft)
  const approve = useAgentStore((state) => state.approveAssessmentDraft)
  const [preview, setPreview] = useState(false)
  const criteria = getCriteria(openingId)
  const checks = checkAssessment(draft, openingId)
  const total = draft.questions.reduce((sum, question) => sum + question.minutes, 0)
  const patch = (id: string, change: Partial<(typeof draft.questions)[number]>) => setDraft({ ...draft, questions: draft.questions.map((question) => (question.id === id ? { ...question, ...change } : question)) })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-palette-neutral-900">{assessmentTitle(draft)}</p>
          <p className="text-xs text-palette-neutral-550">
            {draft.questions.length} questions · {total} minutes · {draft.approvedVersion ? `approved v${draft.approvedVersion}${draft.editedSinceApproval ? ', edited since' : ''}` : 'not approved yet'}
          </p>
        </div>
        <button type="button" className={btn.secondary} onClick={() => setPreview((value) => !value)}>
          {preview ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          {preview ? 'Edit' : 'Candidate preview'}
        </button>
        <button type="button" className={btn.primary} disabled={!checks.every((check) => check.ok) || (!!draft.approvedVersion && !draft.editedSinceApproval)} onClick={approve}>
          Approve as template
        </button>
      </div>

      <section className="grid gap-2 @lg:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
            {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-palette-success-600" aria-hidden="true" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-palette-warning-600" aria-hidden="true" />}
            <div>
              <p className="text-xs font-semibold text-palette-neutral-900">{check.label}</p>
              <p className="text-xs text-palette-neutral-600">{check.detail}</p>
            </div>
          </div>
        ))}
      </section>

      {preview ? (
        <article className="rounded-xl border border-border bg-white p-6">
          <h3 className="text-base font-semibold text-palette-neutral-900">Senior Product Designer · Assessment</h3>
          <p className="mt-1 text-sm text-palette-neutral-600">About {total} minutes. Answer in whatever format suits you best.</p>
          <ol className="mt-4 space-y-4">
            {draft.questions.map((question, index) => (
              <li key={question.id}>
                <p className="text-sm font-medium text-palette-neutral-900">
                  {index + 1}. {question.prompt}
                </p>
                <p className="text-xs text-palette-neutral-500">
                  {question.format} · {question.minutes} min
                </p>
              </li>
            ))}
          </ol>
        </article>
      ) : (
        <ol className="space-y-3">
          {draft.questions.map((question, index) => (
            <li key={question.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-palette-neutral-500">Q{index + 1}</span>
                <select value={question.criterionKey ?? ''} onChange={(event) => patch(question.id, { criterionKey: (event.target.value || undefined) as CriterionKey | undefined })} className="rounded-md border border-border bg-card px-1.5 py-1 text-xs">
                  <option value="">Not linked to a requirement</option>
                  {criteria.map((criterion) => (
                    <option key={criterion.key} value={criterion.key}>
                      {criterion.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-palette-neutral-550">{question.format}</span>
                <label className="ml-auto flex items-center gap-1 text-xs text-palette-neutral-600">
                  <input type="number" min={5} max={90} value={question.minutes} onChange={(event) => patch(question.id, { minutes: Number(event.target.value) || 5 })} className="w-14 rounded-md border border-border px-1.5 py-0.5" />
                  min
                </label>
                <button type="button" aria-label="Remove question" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((entry) => entry.id !== question.id) })} className="rounded p-1 text-palette-neutral-400 hover:text-palette-danger-600">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <textarea value={question.prompt} onChange={(event) => patch(question.id, { prompt: event.target.value })} rows={2} className={cn(inputBase, 'mt-2 text-[13px]')} aria-label={`Question ${index + 1}`} />
              <Label className="mt-2">Evaluation criteria · what good looks like</Label>
              <textarea value={question.lookFor} onChange={(event) => patch(question.id, { lookFor: event.target.value })} rows={2} className={cn(inputBase, 'mt-1 text-[13px]')} aria-label={`What to look for in question ${index + 1}`} />
            </li>
          ))}
        </ol>
      )}
      {!preview && (
        <button
          type="button"
          className={btn.secondary}
          onClick={() => {
            added += 1
            setDraft({ ...draft, questions: [...draft.questions, { id: `q-ws-${added}`, format: 'Structured discussion', minutes: 15, prompt: '', lookFor: '' }] })
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add question
        </button>
      )}
      <p className="text-xs text-palette-neutral-550">
        This is the Assessment agent's working draft. Sending it to a candidate always needs your approval, from{' '}
        <Link to="/agents/assessment/test" className="font-medium text-palette-brand-700 hover:underline">
          the agent's testing studio
        </Link>
        .
      </p>
    </div>
  )
}
