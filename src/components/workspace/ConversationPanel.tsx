import { ArrowUp, Bookmark, BookmarkCheck, Check, CheckCircle2, ChevronDown, CircleAlert, FileSearch, HelpCircle, Loader2, PanelLeftClose, Quote, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCandidate } from '../../data/candidates'
import { getCriterionName } from '../../data/criteria'
import { getEvidenceSource, getPassage } from '../../data/sources'
import { cn } from '../../lib/cn'
import { STEP_DURATION_MS, useWorkspaceStore } from '../../store/useWorkspaceStore'
import type { ChatMessage, Claim, WorkspaceTask } from '../../types/workspace'
import { TaskStatusPill } from './ui'
import { btn, displayStatus, useNow } from './styles'

function ProgressList({ message, now }: { message: ChatMessage; now: number }) {
  const steps = message.steps ?? []
  const elapsed = now - message.createdAt
  const done = Math.min(steps.length, Math.floor(elapsed / STEP_DURATION_MS))
  const running = done < steps.length
  const [open, setOpen] = useState(false)
  if (!steps.length) return null
  if (!running && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-palette-neutral-550 hover:text-palette-neutral-800">
        <Check className="h-3 w-3 text-palette-success-600" aria-hidden="true" />
        {steps.length} steps completed
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </button>
    )
  }
  return (
    <ol className="mb-2 space-y-1 rounded-lg border border-border bg-palette-neutral-100 px-2.5 py-2" aria-live="polite">
      {steps.map((step, index) => {
        const state = index < done ? 'done' : index === done && running ? 'active' : 'waiting'
        return (
          <li key={step.label} className="flex items-start gap-2 text-xs">
            {state === 'done' ? (
              <Check className="mt-px h-3.5 w-3.5 shrink-0 text-palette-success-600" aria-hidden="true" />
            ) : state === 'active' ? (
              <Loader2 className="mt-px h-3.5 w-3.5 shrink-0 animate-spin text-palette-brand-500" aria-hidden="true" />
            ) : (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full border border-palette-neutral-400" aria-hidden="true" />
            )}
            <span className={cn(state === 'waiting' ? 'text-palette-neutral-450' : 'text-palette-neutral-700')}>
              {step.label}
              {step.detail && <span className="text-palette-neutral-500"> · {step.detail}</span>}
            </span>
          </li>
        )
      })}
      {!running && (
        <li>
          <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-medium text-palette-neutral-550 hover:text-palette-neutral-800">
            Hide steps
          </button>
        </li>
      )}
    </ol>
  )
}

function ClaimList({ claims, onOpen }: { claims: Claim[]; onOpen: (claim: Claim) => void }) {
  return (
    <ul className="mt-2 space-y-1">
      {claims.map((claim) => (
        <li key={`${claim.candidateId}-${claim.criterionKey}-${claim.text}`}>
          <button
            type="button"
            onClick={() => onOpen(claim)}
            className="group flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-[13px] leading-snug text-palette-neutral-800 hover:bg-palette-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palette-brand-500" aria-hidden="true" />
            <span className="underline decoration-palette-brand-250 decoration-dotted underline-offset-2 group-hover:decoration-palette-brand-500">{claim.text}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function AiMessage({ task, message, now, isLast }: { task: WorkspaceTask; message: ChatMessage; now: number; isLast: boolean }) {
  const navigate = useNavigate()
  const send = useWorkspaceStore((state) => state.send)
  const setView = useWorkspaceStore((state) => state.setView)
  const focusCriterion = useWorkspaceStore((state) => state.focusCriterion)
  const approveAdvance = useWorkspaceStore((state) => state.approveAdvance)
  const cancelProposal = useWorkspaceStore((state) => state.cancelProposal)
  const running = !!message.steps?.length && now - message.createdAt < message.steps.length * STEP_DURATION_MS

  const openClaim = (claim: Claim) => {
    const source = getEvidenceSource(claim.candidateId, claim.criterionKey)
    focusCriterion(task.id, claim.candidateId, claim.criterionKey)
    setView(task.id, { type: 'source', candidateId: claim.candidateId, passageIds: [...source.passageIds, ...(source.conflict?.passageIds ?? [])], criterionKey: claim.criterionKey })
  }

  const ToneIcon = message.tone === 'clarify' ? HelpCircle : message.tone === 'limitation' ? CircleAlert : message.tone === 'done' ? CheckCircle2 : Sparkles
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-palette-neutral-550">
        <ToneIcon
          className={cn(
            'h-3.5 w-3.5',
            message.tone === 'done' ? 'text-palette-success-600' : message.tone === 'limitation' || message.tone === 'clarify' ? 'text-palette-warning-600' : 'text-palette-brand-500',
          )}
          aria-hidden="true"
        />
        HireFlow AI
      </div>
      <ProgressList message={message} now={now} />
      {!running && (
        <>
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-palette-neutral-800">{message.text}</p>
          {message.claims && message.claims.length > 0 && <ClaimList claims={message.claims} onOpen={openClaim} />}
          {message.changes && message.changes.length > 0 && (
            <div className="mt-2 rounded-lg border border-palette-success-300 bg-palette-success-100 px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-palette-success-700">Changed in HireFlow</p>
              <ul className="mt-1 space-y-0.5">
                {message.changes.map((change) => (
                  <li key={change} className="text-xs text-palette-success-800">
                    · {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {message.proposal && (
            <div className={cn('mt-2 rounded-lg border p-3', message.proposal.state === 'open' ? 'border-palette-warning-400 bg-palette-warning-100' : 'border-border bg-palette-neutral-100')}>
              <p className="text-sm font-semibold text-palette-neutral-900">{message.proposal.title}</p>
              <ul className="mt-1 space-y-0.5">
                {message.proposal.consequences.map((line) => (
                  <li key={line} className="text-xs text-palette-neutral-700">
                    · {line}
                  </li>
                ))}
              </ul>
              {message.proposal.state === 'open' ? (
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    className={btn.primary}
                    onClick={() => {
                      const action = message.proposal!.action
                      if (action.kind === 'advance') approveAdvance(task.id, action.candidateIds, action.toStage, message.id)
                    }}
                  >
                    Approve
                  </button>
                  <button type="button" className={btn.secondary} onClick={() => cancelProposal(task.id, message.id)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-palette-neutral-600">{message.proposal.state === 'approved' ? 'Approved by you' : 'Cancelled'}</p>
              )}
            </div>
          )}
          {isLast && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {message.suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  className={btn.chip}
                  onClick={() => (suggestion.href ? navigate(suggestion.href) : suggestion.query && send(task.id, suggestion.query))}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ContextChips({ task }: { task: WorkspaceTask }) {
  const selectPassage = useWorkspaceStore((state) => state.selectPassage)
  const passage = task.selectedPassageId ? getPassage(task.selectedPassageId) : undefined
  const focus = task.focusCandidateId ? getCandidate(task.focusCandidateId) : undefined
  if (!passage && !focus) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1.5">
      {passage ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-palette-brand-100 px-2 py-1 text-[11px] font-medium text-palette-brand-700">
          <Quote className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">Asking about: “{passage.passage.text}”</span>
          <button type="button" onClick={() => selectPassage(task.id, null)} aria-label="Clear selected passage" className="rounded p-0.5 hover:bg-palette-brand-150">
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ) : (
        focus && (
          <span className="inline-flex items-center gap-1 rounded-md bg-palette-neutral-200 px-2 py-1 text-[11px] font-medium text-palette-neutral-700">
            Context: {focus.name}
            {task.focusCriterionKey && <span className="text-palette-neutral-550">· {getCriterionName(focus.openingId, task.focusCriterionKey)}</span>}
          </span>
        )
      )}
    </div>
  )
}

const PASSAGE_PROMPTS = ['How relevant is this experience?', 'Compare this with the job requirements', 'Does this demonstrate ownership?', 'What should I validate in the interview?']

export function ConversationPanel({ task, onCollapse }: { task: WorkspaceTask; onCollapse?: () => void }) {
  const send = useWorkspaceStore((state) => state.send)
  const toggleSaved = useWorkspaceStore((state) => state.toggleSaved)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const lastAi = [...task.messages].reverse().find((message) => message.role === 'ai')
  const animationEnds = lastAi?.steps ? lastAi.createdAt + lastAi.steps.length * STEP_DURATION_MS + 200 : 0
  const now = useNow(Math.max(animationEnds, task.revealAt))
  const animating = now < animationEnds

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [task.messages.length, animating])

  const submit = (text: string) => {
    if (!text.trim()) return
    send(task.id, text)
    setDraft('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-palette-neutral-900" title={task.title}>
            {task.title}
          </p>
          <div className="mt-1">
            <TaskStatusPill status={displayStatus(task, now)} />
          </div>
        </div>
        <button type="button" onClick={() => toggleSaved(task.id)} className={btn.ghost} aria-label={task.saved ? 'Remove from saved' : 'Save investigation'} title={task.saved ? 'Saved' : 'Save for later'}>
          {task.saved ? <BookmarkCheck className="h-4 w-4 text-palette-brand-600" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
        </button>
        {onCollapse && (
          <button type="button" onClick={onCollapse} className={btn.ghost} aria-label="Collapse conversation" title="Collapse conversation">
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {task.messages.map((message, index) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex flex-col items-end gap-1">
              {message.context && <p className="max-w-[90%] truncate text-[11px] text-palette-neutral-550">{message.context}</p>}
              <p className="max-w-[90%] rounded-2xl rounded-br-md bg-palette-neutral-200 px-3 py-2 text-[13.5px] text-palette-neutral-900">{message.text}</p>
            </div>
          ) : (
            <AiMessage key={message.id} task={task} message={message} now={now} isLast={index === task.messages.length - 1} />
          ),
        )}
      </div>

      <div className="border-t border-border p-3">
        {task.selectedPassageId && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {PASSAGE_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className={btn.chip} onClick={() => submit(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}
        <ContextChips task={task} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit(draft)
          }}
          className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit(draft)
              }
            }}
            rows={1}
            placeholder={task.selectedPassageId ? 'Ask about the selected passage…' : 'Ask a follow-up or give an instruction…'}
            aria-label="Message HireFlow AI"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-450 focus:outline-none"
          />
          <button type="submit" disabled={!draft.trim()} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
