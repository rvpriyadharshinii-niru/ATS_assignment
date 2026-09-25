import type { Candidate } from '../types/domain'

export function buildStatusNote(candidate: Candidate): string | undefined {
  if (candidate.waitingOn === 'priya' && candidate.waitingDays !== undefined) return `Waiting on your feedback · ${candidate.waitingDays}d`
  if (candidate.waitingOn === 'other' && candidate.waitingDays !== undefined) return `Waiting on another interviewer · ${candidate.waitingDays}d`
  if (candidate.interviewStatus) return candidate.interviewStatus
  return undefined
}
