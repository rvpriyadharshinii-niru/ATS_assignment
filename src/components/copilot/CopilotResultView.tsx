import { Link } from 'react-router-dom'
import { getFollowUpSuggestions } from '../../copilot/engine'
import { getCandidate } from '../../data/candidates'
import { getCriteria } from '../../data/criteria'
import { useAppStore } from '../../store/useAppStore'
import type { CopilotResult } from '../../types/copilot'
import { CandidateCard } from '../candidates/CandidateCard'
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

export function CopilotResultView({ result }: { result: CopilotResult }) {
  if (result.kind === 'text') {
    return <p className="font-sans text-sm leading-relaxed text-foreground">{result.message}</p>
  }

  if (result.kind === 'clarify') {
    return <p className="font-sans text-sm leading-relaxed italic text-muted-foreground">{result.message}</p>
  }

  if (result.kind === 'evidence') {
    const candidate = getCandidate(result.candidateId)
    if (!candidate) return <p className="text-sm text-muted-foreground">{result.message}</p>
    const criteria = getCriteria(candidate.openingId)
    return (
      <div>
        <p className="font-sans text-sm leading-relaxed text-foreground">{result.message}</p>
        <div className="mt-3 rounded-lg border border-border bg-muted p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-palette-neutral-900">{candidate.name}</span>
            <RecommendationBadge label={candidate.recommendation} />
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

  const matchedCandidates = result.candidateIds.map((id) => getCandidate(id)).filter((candidate) => candidate !== undefined)

  return (
    <div>
      <p className="font-sans text-sm leading-relaxed text-foreground">{result.message}</p>
      <div className="mt-3 space-y-2">
        {matchedCandidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
      <FollowUpSuggestions result={result} />
    </div>
  )
}
