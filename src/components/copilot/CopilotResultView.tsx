import { Link } from 'react-router-dom'
import { getCandidate } from '../../data/candidates'
import { getCriteria } from '../../data/criteria'
import type { CopilotResult } from '../../types/copilot'
import { CandidateCard } from '../candidates/CandidateCard'
import { CriterionEvidenceList } from '../candidates/CriterionEvidence'
import { RecommendationBadge } from '../candidates/RecommendationBadge'

export function CopilotResultView({ result }: { result: CopilotResult }) {
  if (result.kind === 'text') {
    return <p className="text-sm leading-relaxed text-neutral-700">{result.message}</p>
  }

  if (result.kind === 'clarify') {
    return <p className="text-sm leading-relaxed text-neutral-500 italic">{result.message}</p>
  }

  if (result.kind === 'evidence') {
    const candidate = getCandidate(result.candidateId)
    if (!candidate) return <p className="text-sm text-neutral-500">{result.message}</p>
    const criteria = getCriteria(candidate.openingId)
    return (
      <div>
        <p className="text-sm leading-relaxed text-neutral-700">{result.message}</p>
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-neutral-900">{candidate.name}</span>
            <RecommendationBadge label={candidate.recommendation} />
          </div>
          <div className="mt-1">
            <CriterionEvidenceList criteria={criteria} evidence={candidate.evidence} compact />
          </div>
          <Link
            to={`/candidates/${candidate.id}`}
            className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            View full evidence
          </Link>
        </div>
      </div>
    )
  }

  const matchedCandidates = result.candidateIds.map((id) => getCandidate(id)).filter((candidate) => candidate !== undefined)

  return (
    <div>
      <p className="text-sm leading-relaxed text-neutral-700">{result.message}</p>
      <div className="mt-3 space-y-2">
        {matchedCandidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  )
}
