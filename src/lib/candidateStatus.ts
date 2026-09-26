import type { Candidate, CriterionKey } from '../types/domain'

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

/** The same offset `deriveAppliedDate` formats — split out so seed activity timestamps stay consistent with it. */
function deriveAppliedOffsetDays(candidate: Candidate): number {
  return 10 + (hashString(candidate.id) % 26)
}

export function deriveAppliedTimestamp(candidate: Candidate): number {
  const date = new Date()
  date.setDate(date.getDate() - deriveAppliedOffsetDays(candidate))
  return date.getTime()
}

/** Profile facts, not AI verdicts — no percentages or invented proficiency scores, ever. */
const SKILL_LABEL_BY_CRITERION: Partial<Record<CriterionKey, string>> = {
  enterpriseSaas: 'Enterprise SaaS',
  complexWorkflows: 'Complex Workflows',
  aiProductExperience: 'AI Products',
  designSystems: 'Design Systems',
  leadership: 'Leadership',
  communicationSkills: 'Communication',
  crossFunctionalCollaboration: 'Cross-functional Collaboration',
  mentorship: 'Mentorship',
}

/** Rounds out every candidate's chip list to a consistent, plausible Senior Product Designer skill set. */
const GENERIC_SPD_SKILL_POOL = ['Interaction Design', 'Product Strategy', 'Prototyping', 'User Research']

export function deriveSkills(candidate: Candidate): string[] {
  const evidenceSkills = candidate.evidence
    .filter((item) => item.strength === 'Strong' || item.strength === 'Good')
    .map((item) => SKILL_LABEL_BY_CRITERION[item.criterionKey])
    .filter((label): label is string => !!label)
  return [...evidenceSkills, ...GENERIC_SPD_SKILL_POOL]
}

export interface ExperienceEntry {
  company: string
  role: string
  dateRange: string
  duration: string
  location?: string
  bullets: string[]
}

const PREVIOUS_ROLE_TITLES = ['Product Designer', 'UX Designer', 'Senior UX Designer', 'Product Designer II']

/** Not a real field — a stable 2-entry chronological timeline derived from current role/company/experience. */
export function deriveExperience(candidate: Candidate): ExperienceEntry[] {
  const totalYears = candidate.experienceYears ?? 6
  const currentSpan = Math.max(2, Math.min(totalYears - 1, Math.round(totalYears * 0.5)))
  const previousSpan = Math.max(1, totalYears - currentSpan)
  const currentStartYear = new Date().getFullYear() - currentSpan
  const previousStartYear = currentStartYear - previousSpan

  const entries: ExperienceEntry[] = []
  if (candidate.currentRole || candidate.currentCompany) {
    entries.push({
      company: candidate.currentCompany ?? 'Current company',
      role: candidate.currentRole ?? 'Senior Product Designer',
      dateRange: `${currentStartYear} - Present`,
      duration: `${currentSpan} yr${currentSpan === 1 ? '' : 's'}`,
      location: candidate.location,
      bullets: [
        'Led enterprise workflow experiences across configuration-heavy products.',
        'Worked on AI-assisted product experiences and scalable design-system patterns.',
      ],
    })
  }

  entries.push({
    company: 'Previous Company',
    role: PREVIOUS_ROLE_TITLES[hashString(`${candidate.id}-prev-role`) % PREVIOUS_ROLE_TITLES.length],
    dateRange: `${previousStartYear} - ${currentStartYear}`,
    duration: `${previousSpan} yr${previousSpan === 1 ? '' : 's'}`,
    bullets: ['Designed B2B workflows across operations and administration.', 'Collaborated with product and engineering teams on end-to-end releases.'],
  })

  return entries
}

export interface EducationInfo {
  degree: string
  school: string
  dateRange: string
}

const DEGREES = ['Bachelor of Design', 'Bachelor of Fine Arts', 'Bachelor of Technology']
const SCHOOLS = ['National Institute of Design', 'Srishti Institute of Art, Design and Technology', 'IIT Bombay']

/** Not a real field — a small, secondary, deterministic education line so the profile never looks incomplete. */
export function deriveEducation(candidate: Candidate): EducationInfo {
  const index = hashString(`${candidate.id}-education`)
  const totalYears = candidate.experienceYears ?? 6
  const gradYear = new Date().getFullYear() - totalYears
  const startYear = gradYear - 4
  return {
    degree: DEGREES[index % DEGREES.length],
    school: SCHOOLS[index % SCHOOLS.length],
    dateRange: `${startYear} - ${gradYear}`,
  }
}

export interface CandidateLinks {
  linkedin: string
  portfolio: string
}

/** Fictional, non-navigable placeholders — never a real registered domain or an actual person's profile. */
export function deriveLinks(candidate: Candidate): CandidateLinks {
  const slug = candidate.name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return {
    linkedin: `linkedin.com/in/${slug}`,
    portfolio: `${slug}.design`,
  }
}

export interface ActivityFeedItem {
  id: string
  timestamp: number
  label: string
  detail?: string
}

/** Not real fields — a deterministic pre-history so the Activity tab always reads as a real, chronological record. */
export function deriveSeedActivity(candidate: Candidate): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = []
  const appliedAt = deriveAppliedTimestamp(candidate)

  if (candidate.source) {
    items.push({ id: `${candidate.id}-seed-applied`, timestamp: appliedAt, label: 'Application received', detail: `Source: ${candidate.source}` })
  }

  if (candidate.prioritiesSupported !== undefined) {
    items.push({
      id: `${candidate.id}-seed-screened`,
      timestamp: appliedAt + 1000 * 60 * 60 * 52,
      label: 'AI screening completed',
      detail: `${candidate.prioritiesSupported} of 5 configured priorities supported`,
    })
  }

  if (candidate.stage !== 'Applied' && candidate.stage !== 'AI Screened') {
    items.push({
      id: `${candidate.id}-seed-surfaced`,
      timestamp: appliedAt + 1000 * 60 * 60 * 52 + 1000 * 60 * 2,
      label: 'Candidate surfaced for Hiring Manager review',
    })
  }

  if (candidate.interviewStatus) {
    items.push({
      id: `${candidate.id}-seed-interview-status`,
      timestamp: Date.now() - 1000 * 60 * 60 * 20,
      label: candidate.interviewStatus,
    })
  }

  return items
}

/** "TODAY" for the current day, else an uppercase short date — matches how the Activity tab groups entries. */
export function deriveDayGroupLabel(timestamp: number): string {
  const date = new Date(timestamp)
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)
  if (dayDiff === 0) return 'TODAY'
  if (dayDiff === 1) return 'YESTERDAY'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}
