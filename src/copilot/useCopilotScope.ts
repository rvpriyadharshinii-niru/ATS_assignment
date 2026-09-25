import { getCandidate } from '../data/candidates'
import { getOpening } from '../data/openings'
import { useAppStore } from '../store/useAppStore'
import type { CopilotScopeLevel } from '../types/copilot'

export function useCopilotScope(): { level: CopilotScopeLevel; label: string } {
  const openingId = useAppStore((state) => state.selectedOpeningId)
  const candidateId = useAppStore((state) => state.selectedCandidateId)

  if (candidateId) {
    const candidate = getCandidate(candidateId)
    const opening = candidate ? getOpening(candidate.openingId) : undefined
    return { level: 'candidate', label: candidate && opening ? `${opening.title} / ${candidate.name}` : 'Candidate' }
  }
  if (openingId) {
    const opening = getOpening(openingId)
    return { level: 'role', label: opening?.title ?? 'Role' }
  }
  return { level: 'global', label: 'All my openings' }
}
