import { getOpening } from '../data/openings'
import type { Candidate } from '../types/domain'

/** Shared default subject/body for a candidate follow-up — used by the manual "Send email" action and Copilot's email draft. */
export function buildDefaultEmail(candidate: Candidate, askAvailability = false): { subject: string; body: string } {
  const opening = getOpening(candidate.openingId)
  const roleTitle = opening?.title ?? 'this role'
  const firstName = candidate.name.split(' ')[0]
  const subject = `Next steps — ${roleTitle}`
  const body = askAvailability
    ? `Hi ${firstName},\n\nWe'd like to move forward with the next stage of the ${roleTitle} process.\n\nCould you share your availability for an interview next week?\n\nThanks,\nPriya`
    : `Hi ${firstName},\n\nWe'd like to follow up regarding the ${roleTitle} process.\n\nThanks,\nPriya`
  return { subject, body }
}
