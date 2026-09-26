import { ArrowRight, Quote } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFollowUpSuggestions } from '../../copilot/engine'
import { getCandidate } from '../../data/candidates'
import { getCriteria } from '../../data/criteria'
import { cn } from '../../lib/cn'
import { useAllEffectiveCandidates } from '../../store/candidateSelectors'
import { useAppStore } from '../../store/useAppStore'
import type { CandidateFilter } from '../../types/domain'
import type { CopilotResult, InterviewFeedbackEntry } from '../../types/copilot'
import { CandidateCard } from '../candidates/CandidateCard'
import { ComparisonView } from '../candidates/ComparisonView'
import { CriterionEvidenceList, CriterionRow } from '../candidates/CriterionEvidence'
import { RecommendationBadge } from '../candidates/RecommendationBadge'

function NavToAction({ navTo, filter }: { navTo: { label: string; path: string }; filter?: CandidateFilter }) {
  const navigate = useNavigate()
  const addFilter = useAppStore((state) => state.addFilter)
  const closeCopilot = useAppStore((state) => state.closeCopilot)

  return (
    <button
      type="button"
      onClick={() => {
        if (filter) addFilter(filter)
        navigate(navTo.path)
        closeCopilot()
      }}
      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {navTo.label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}

function FollowUpSuggestions({ result }: { result: CopilotResult }) {
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)
  const suggestions = getFollowUpSuggestions(result)
  if (suggestions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => submitCopilotMessage(suggestion)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-palette-neutral-600 hover:border-palette-brand-300 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

function ConfirmCard({ turnId, result }: { turnId: string; result: Extract<CopilotResult, { kind: 'confirm' }> }) {
  const confirmPendingAction = useAppStore((state) => state.confirmPendingAction)
  const cancelPendingAction = useAppStore((state) => state.cancelPendingAction)
  const isDestructive = result.action.kind === 'reject'

  return (
    <div className="rounded-lg border border-border bg-muted p-3.5">
      <p className="text-sm font-semibold text-palette-neutral-900">{result.title}</p>
      {result.lines.map((line) => (
        <p key={line} className="mt-1 text-sm text-muted-foreground">
          {line}
        </p>
      ))}
      <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">This will</p>
      <ul className="mt-1 space-y-0.5">
        {result.consequences.map((consequence) => (
          <li key={consequence} className="text-sm text-foreground">
            · {consequence}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => cancelPendingAction(turnId)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => confirmPendingAction(turnId, result.action)}
          className={
            isDestructive
              ? 'rounded-lg bg-destructive px-3.5 py-1.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              : 'rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          }
        >
          {result.confirmLabel}
        </button>
      </div>
    </div>
  )
}

function EmailDraftCard({ turnId, result }: { turnId: string; result: Extract<CopilotResult, { kind: 'emailDraft' }> }) {
  const sendEmailFromCopilot = useAppStore((state) => state.sendEmailFromCopilot)
  const cancelPendingAction = useAppStore((state) => state.cancelPendingAction)
  const [subject, setSubject] = useState(result.subject)
  const [body, setBody] = useState(result.body)

  return (
    <div className="rounded-lg border border-border bg-muted p-3.5">
      <p className="text-sm font-semibold text-palette-neutral-900">Draft email</p>
      <div className="mt-2.5 space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          To
          <p className="mt-0.5 text-sm text-foreground">{result.to}</p>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Message
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => cancelPendingAction(turnId)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => sendEmailFromCopilot(turnId, result.candidateId, subject, body)}
          className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Confirm &amp; send
        </button>
      </div>
    </div>
  )
}

function PipelineDiagnosisCard({ result }: { result: Extract<CopilotResult, { kind: 'pipelineDiagnosis' }> }) {
  return (
    <div>
      <p className="text-sm font-semibold text-palette-neutral-900">{result.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{result.message}</p>
      {result.waitingOnYou.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Waiting on you</p>
          <ul className="mt-1 space-y-0.5">
            {result.waitingOnYou.map((entry) => (
              <li key={entry.candidateId} className="text-sm text-foreground">
                {getCandidate(entry.candidateId)?.name ?? entry.candidateId} — {entry.days} days
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.waitingOnOthers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Waiting on others</p>
          <ul className="mt-1 space-y-0.5">
            {result.waitingOnOthers.map((entry) => (
              <li key={entry.candidateId} className="text-sm text-foreground">
                {getCandidate(entry.candidateId)?.name ?? entry.candidateId} — {entry.days} days
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.navTo && <NavToAction navTo={result.navTo} />}
      <FollowUpSuggestions result={result} />
    </div>
  )
}

function CrossRoleAttentionCard({ result }: { result: Extract<CopilotResult, { kind: 'crossRoleAttention' }> }) {
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)

  return (
    <div>
      <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
      <div className="mt-3 space-y-3">
        {result.items.map((item) => (
          <div key={item.openingId} className="border-l-2 border-palette-brand-200 pl-3">
            <p className="text-xs font-semibold text-primary">{item.openingTitle}</p>
            <p className="mt-0.5 text-sm text-foreground">{item.headline}</p>
            {item.action && (
              <button
                type="button"
                onClick={() => submitCopilotMessage(item.action!.query, { ignorePageContext: true })}
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.action.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewQueueCard({ result }: { result: Extract<CopilotResult, { kind: 'reviewQueue' }> }) {
  const effectiveCandidates = useAllEffectiveCandidates()
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)

  return (
    <div>
      <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
      <div className="mt-3 space-y-2.5">
        {result.items.map((item) => {
          const candidate = effectiveCandidates.find((c) => c.id === item.candidateId)
          if (!candidate) return null
          const firstName = candidate.name.split(' ')[0]
          return (
            <div key={item.candidateId} className="rounded-lg border border-border bg-muted p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</span>
                {candidate.waitingDays !== undefined && (
                  <span className="shrink-0 text-xs text-muted-foreground">Waiting {candidate.waitingDays}d</span>
                )}
              </div>
              {item.strengths.length > 0 && (
                <p className="mt-1.5 text-xs leading-relaxed text-foreground">
                  <span className="font-semibold text-palette-success-700">Strong evidence: </span>
                  {item.strengths.join(', ')}
                </p>
              )}
              {item.concerns.length > 0 && (
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  <span className="font-semibold text-palette-warning-700">Needs clarification: </span>
                  {item.concerns.join(', ')}
                </p>
              )}
              <button
                type="button"
                onClick={() => submitCopilotMessage(`Review ${firstName}`)}
                className="mt-2 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Review {firstName}
              </button>
            </div>
          )
        })}
      </div>
      {result.navTo && <NavToAction navTo={result.navTo} />}
    </div>
  )
}

const FEEDBACK_SENTIMENT_TONE: Record<InterviewFeedbackEntry['sentiment'], string> = {
  positive: 'text-palette-success-700',
  mixed: 'text-palette-warning-700',
  negative: 'text-palette-danger-700',
}

function CandidateReviewCard({ result }: { result: Extract<CopilotResult, { kind: 'candidateReview' }> }) {
  const effectiveCandidates = useAllEffectiveCandidates()
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)
  const candidate = effectiveCandidates.find((c) => c.id === result.candidateId)
  if (!candidate) return <p className="text-sm text-muted-foreground">{result.message}</p>
  const criteria = getCriteria(candidate.openingId)

  return (
    <div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{result.message}</p>

      {result.hasScorecard && (
        <div className="mt-3 space-y-3">
          {result.experience.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Experience</p>
              <div className="mt-1 space-y-0.5">
                {result.experience.map((entry) => (
                  <p key={`${entry.company}-${entry.dateRange}`} className="text-sm text-foreground">
                    {entry.role} · {entry.company} <span className="text-xs text-muted-foreground">({entry.dateRange})</span>
                  </p>
                ))}
              </div>
            </div>
          )}
          {result.skills.length > 0 && (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-palette-neutral-900">Skills: </span>
              {result.skills.join(', ')}
            </p>
          )}
          {(result.strengths.length > 0 || result.concerns.length > 0) && (
            <div className="rounded-lg border border-border bg-muted p-3.5">
              {result.strengths.length > 0 && (
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-semibold text-palette-success-700">Strengths: </span>
                  {result.strengths.join(', ')}
                </p>
              )}
              {result.concerns.length > 0 && (
                <p className={cn('text-sm leading-relaxed text-foreground', result.strengths.length > 0 && 'mt-1.5')}>
                  <span className="font-semibold text-palette-warning-700">Concern / uncertainty: </span>
                  {result.concerns.join(', ')}
                </p>
              )}
            </div>
          )}

          {result.feedback.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Interviewer feedback</p>
              <div className="mt-1.5 space-y-2">
                {result.feedback.map((entry) => (
                  <div key={`${entry.reviewer}-${entry.quote}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5">
                      <Quote className="h-3 w-3 shrink-0 text-palette-neutral-400" aria-hidden="true" />
                      <span className="text-xs font-semibold text-palette-neutral-900">{entry.reviewer}</span>
                      <span className={cn('text-xs font-medium', FEEDBACK_SENTIMENT_TONE[entry.sentiment])}>
                        {entry.sentiment === 'positive' ? 'Positive' : entry.sentiment === 'mixed' ? 'Positive with question' : 'Negative'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">&ldquo;{entry.quote}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">Scorecard</p>
            <div className="mt-1 rounded-lg border border-border bg-muted p-2">
              <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} compact />
            </div>
          </div>
        </div>
      )}

      {result.decisions.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground">What would you like to do?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.decisions.map((decision) => (
              <button
                key={decision.label}
                type="button"
                onClick={() => submitCopilotMessage(decision.query)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  decision.label === 'Reject'
                    ? 'bg-destructive text-destructive-foreground'
                    : decision.label.startsWith('Advance')
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-foreground hover:bg-muted',
                )}
              >
                {decision.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {result.navTo && <NavToAction navTo={result.navTo} />}
    </div>
  )
}

export function CopilotResultView({ turnId, result }: { turnId: string; result: CopilotResult }) {
  const effectiveCandidates = useAllEffectiveCandidates()
  const findCandidate = (id: string) => effectiveCandidates.find((candidate) => candidate.id === id)

  if (result.kind === 'text') {
    return <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{result.message}</p>
  }

  if (result.kind === 'clarify') {
    return <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{result.message}</p>
  }

  if (result.kind === 'crossRoleAttention') {
    return <CrossRoleAttentionCard result={result} />
  }

  if (result.kind === 'reviewQueue') {
    return <ReviewQueueCard result={result} />
  }

  if (result.kind === 'candidateReview') {
    return <CandidateReviewCard result={result} />
  }

  if (result.kind === 'actionComplete') {
    const acted = result.candidateIds?.map((id) => findCandidate(id)).filter((candidate) => candidate !== undefined) ?? []
    return (
      <div>
        <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
        {acted.length > 0 && (
          <div className="mt-3 space-y-2">
            {acted.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} variant="board" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (result.kind === 'confirm') {
    return <ConfirmCard turnId={turnId} result={result} />
  }

  if (result.kind === 'emailDraft') {
    return <EmailDraftCard turnId={turnId} result={result} />
  }

  if (result.kind === 'pipelineDiagnosis') {
    return <PipelineDiagnosisCard result={result} />
  }

  if (result.kind === 'comparison') {
    const compared = result.candidateIds.map((id) => findCandidate(id)).filter((candidate) => candidate !== undefined)
    if (compared.length === 0) return <p className="text-sm text-muted-foreground">{result.message}</p>
    return <ComparisonView candidates={compared} criteria={getCriteria(compared[0].openingId)} summary={result.message} />
  }

  if (result.kind === 'evidence') {
    const candidate = findCandidate(result.candidateId)
    if (!candidate) return <p className="text-sm text-muted-foreground">{result.message}</p>
    const criteria = getCriteria(candidate.openingId)
    const focusCriterion = result.focusCriterionKey ? criteria.find((criterion) => criterion.key === result.focusCriterionKey) : undefined
    const focusEvidence = result.focusCriterionKey
      ? candidate.evidence.find((evidence) => evidence.criterionKey === result.focusCriterionKey)
      : undefined

    return (
      <div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{result.message}</p>
        <div className="mt-3 rounded-lg border border-border bg-muted p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</span>
            {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
          </div>
          <div className="mt-1">
            {focusCriterion ? (
              <CriterionRow criterion={focusCriterion} evidence={focusEvidence} compact />
            ) : (
              <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} compact />
            )}
          </div>
          <Link
            to={`/candidates/${candidate.id}`}
            className="mt-2.5 inline-block text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View full evidence
          </Link>
        </div>
        {result.followUpNote && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{result.followUpNote}</p>}
        <FollowUpSuggestions result={result} />
      </div>
    )
  }

  const matchedCandidates = result.candidateIds.map((id) => findCandidate(id)).filter((candidate) => candidate !== undefined)

  return (
    <div>
      <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
      <div className="mt-3 space-y-2">
        {matchedCandidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} variant="board" />
        ))}
      </div>
      {result.navTo && <NavToAction navTo={result.navTo} filter={result.appliedFilter} />}
      <FollowUpSuggestions result={result} />
    </div>
  )
}
