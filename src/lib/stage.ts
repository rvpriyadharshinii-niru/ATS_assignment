import type { CandidateStage } from '../types/domain'

export const STAGE_ORDER: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

export function nextStage(stage: CandidateStage): CandidateStage | undefined {
  const index = STAGE_ORDER.indexOf(stage)
  return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : undefined
}

/** Shared with the manual Advance dialog and the Copilot advance confirmation card. */
export function advanceConsequences(toStage: CandidateStage): string[] {
  if (toStage === 'Interview') {
    return ['Update candidate stage', 'Make them available for interview scheduling', 'Allow candidate communication to be prepared']
  }
  if (toStage === 'Final') {
    return ['Update candidate stage', 'Mark them as a finalist for this role']
  }
  if (toStage === 'Offer') {
    return ['Update candidate stage', 'Prepare the next hiring step']
  }
  return ['Update candidate stage']
}
