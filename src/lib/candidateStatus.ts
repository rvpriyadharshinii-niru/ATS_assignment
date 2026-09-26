import type { Candidate } from '../types/domain'

export function buildStatusNote(candidate: Candidate): string | undefined {
  if (candidate.waitingOn === 'priya' && candidate.waitingDays !== undefined) return `Waiting on your feedback · ${candidate.waitingDays}d`
  if (candidate.waitingOn === 'other' && candidate.waitingDays !== undefined) return `Waiting on another interviewer · ${candidate.waitingDays}d`
  if (candidate.interviewStatus) return candidate.interviewStatus
  return undefined
}

/** Stable string hash — used to derive believable-but-deterministic display data, never randomness. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Named prototype records don't carry contact info (see Candidate.email) — derive a plausible one so the Details rail is never blank. */
export function deriveCandidateEmail(candidate: Candidate): string {
  if (candidate.email) return candidate.email
  const slug = candidate.name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
  return `${slug}@example.com`
}

/** A stable, per-candidate "applied on" date within the last ~5 weeks — not a real field in the prototype data. */
export function deriveAppliedDate(candidate: Candidate): string {
  const offsetDays = 10 + (hashString(candidate.id) % 26)
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const INTERVIEW_TYPES = ['Product interview', 'Design interview', 'Portfolio review', 'Panel interview']

/** Not a real field — a stable per-candidate interview type so the Interviews table reads as a real work queue. */
export function deriveInterviewType(candidate: Candidate): string {
  return INTERVIEW_TYPES[hashString(candidate.id) % INTERVIEW_TYPES.length]
}

const INTERVIEW_TIMES = ['9:00 AM', '10:30 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:30 PM', '4:00 PM']

/**
 * Not a real field — derives a plausible interview date/time from what we do track: candidates
 * still waiting on feedback interviewed `waitingDays` ago; unstarted Interview-stage candidates get
 * a near-future slot; Final/Offer candidates' interviews happened further in the past. Shared so the
 * Interviews table and Home's Upcoming list always agree on the same slot for the same candidate.
 */
function deriveInterviewSlot(candidate: Candidate): { date: Date; time: string } {
  const time = INTERVIEW_TIMES[hashString(`${candidate.id}-time`) % INTERVIEW_TIMES.length]
  const date = new Date()
  if (candidate.waitingDays !== undefined) {
    date.setDate(date.getDate() - candidate.waitingDays)
  } else if (candidate.stage === 'Interview') {
    date.setDate(date.getDate() + 1 + (hashString(`${candidate.id}-upcoming`) % 4))
  } else {
    date.setDate(date.getDate() - (5 + (hashString(`${candidate.id}-past`) % 10)))
  }
  return { date, time }
}

export function deriveInterviewDateTime(candidate: Candidate): string {
  const { date, time } = deriveInterviewSlot(candidate)
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${dateLabel} · ${time}`
}

/** "Today"/"Tomorrow"/a short date, split from the time — for a scheduled-events list grouped by day. */
export function deriveInterviewDayLabel(candidate: Candidate): { dayLabel: string; time: string } {
  const { date, time } = deriveInterviewSlot(candidate)
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000)
  const dayLabel = dayDiff === 0 ? 'Today' : dayDiff === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  return { dayLabel, time }
}
