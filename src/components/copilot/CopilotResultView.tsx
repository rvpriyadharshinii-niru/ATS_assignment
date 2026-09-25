import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFollowUpSuggestions } from '../../copilot/engine'
import { getCandidate } from '../../data/candidates'
import { getCriteria } from '../../data/criteria'
import { useAllEffectiveCandidates } from '../../store/candidateSelectors'
import { useAppStore } from '../../store/useAppStore'
import type { CopilotResult } from '../../types/copilot'
import { CandidateCard } from '../candidates/CandidateCard'
import { ComparisonView } from '../candidates/ComparisonView'
import { CriterionEvidenceList } from '../candidates/CriterionEvidence'
import { RecommendationBadge } from '../candidates/RecommendationBadge'

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
      <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">This will</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Waiting on you</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Waiting on others</p>
          <ul className="mt-1 space-y-0.5">
            {result.waitingOnOthers.map((entry) => (
              <li key={entry.candidateId} className="text-sm text-foreground">
                {getCandidate(entry.candidateId)?.name ?? entry.candidateId} — {entry.days} days
              </li>
            ))}
          </ul>
        </div>
      )}
      <FollowUpSuggestions result={result} />
    </div>
  )
}

export function CopilotResultView({ turnId, result }: { turnId: string; result: CopilotResult }) {
  const effectiveCandidates = useAllEffectiveCandidates()
  const findCandidate = (id: string) => effectiveCandidates.find((candidate) => candidate.id === id)

  if (result.kind === 'text') {
    return <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
  }

  if (result.kind === 'clarify') {
    return <p className="text-sm leading-relaxed italic text-muted-foreground">{result.message}</p>
  }

  if (result.kind === 'actionComplete') {
    const acted = result.candidateIds?.map((id) => findCandidate(id)).filter((candidate) => candidate !== undefined) ?? []
    return (
      <div>
        <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
        {acted.length > 0 && (
          <div className="mt-3 space-y-2">
            {acted.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
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
    return (
      <div>
        <p className="text-sm leading-relaxed text-foreground">{result.message}</p>
        <div className="mt-3 rounded-lg border border-border bg-muted p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</span>
            {candidate.recommendation && <RecommendationBadge label={candidate.recommendation} />}
          </div>
          <div className="mt-1">
            <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} compact />
          </div>
          <Link
            to={`/candidates/${candidate.id}`}
            className="mt-2.5 inline-block text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View full evidence
          </Link>
        </div>
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
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
      <FollowUpSuggestions result={result} />
    </div>
  )
}
