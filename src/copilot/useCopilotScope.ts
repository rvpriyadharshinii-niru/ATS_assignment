import { useLocation } from 'react-router-dom'
import { getCandidate } from '../data/candidates'
import { getOpening } from '../data/openings'
import { useAppStore } from '../store/useAppStore'
import type { CopilotScopeLevel } from '../types/copilot'

/** The role-workspace tab a role-scoped path is currently on, e.g. "…/candidates" → "Candidates". */
function tabLabelFromPath(pathname: string): string | undefined {
  if (pathname.endsWith('/candidates')) return 'Candidates'
  if (pathname.endsWith('/pipeline')) return 'Pipeline'
  if (pathname.endsWith('/interviews')) return 'Interviews'
  if (pathname.endsWith('/criteria')) return 'Hiring Criteria'
  return undefined
}

/** Contextual Copilot's scope label doubles as its docked-panel header, e.g. "Senior Product Designer / Candidates". */
export function useCopilotScope(): { level: CopilotScopeLevel; label: string } {
  const openingId = useAppStore((state) => state.selectedOpeningId)
  const candidateId = useAppStore((state) => state.selectedCandidateId)
  const { pathname } = useLocation()

  if (candidateId) {
    const candidate = getCandidate(candidateId)
    const opening = candidate ? getOpening(candidate.openingId) : undefined
    return { level: 'candidate', label: candidate && opening ? `${opening.title} / ${candidate.name}` : 'Candidate' }
  }
  if (openingId) {
    const opening = getOpening(openingId)
    const tabLabel = tabLabelFromPath(pathname)
    return { level: 'role', label: opening ? (tabLabel ? `${opening.title} / ${tabLabel}` : opening.title) : 'Role' }
  }
  return { level: 'global', label: 'All my openings' }
}
