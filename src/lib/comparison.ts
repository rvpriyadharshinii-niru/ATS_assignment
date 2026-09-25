import { STRENGTH_RANK } from './evidence'
import type { Candidate, HiringCriterion } from '../types/domain'

/**
 * Deterministic "meaningful differences" narrative for a comparison — never a
 * winner. For each criterion, names whoever clearly leads (Good or above,
 * and not tied with everyone else); criteria where candidates are roughly
 * level are left out rather than forced into a sentence.
 */
export function buildComparisonSummary(candidatesToCompare: Candidate[], criteria: HiringCriterion[]): string {
  if (candidatesToCompare.length < 2) return ''

  const notes: string[] = []
  for (const criterion of criteria) {
    const ranked = candidatesToCompare
      .map((candidate) => ({
        name: candidate.name,
        strength: candidate.evidence.find((item) => item.criterionKey === criterion.key)?.strength ?? 'Not available',
      }))
      .sort((a, b) => STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength])

    const topRank = STRENGTH_RANK[ranked[0].strength]
    const leaders = ranked.filter((entry) => STRENGTH_RANK[entry.strength] === topRank).map((entry) => entry.name)
    const allTied = leaders.length === candidatesToCompare.length

    if (!allTied && topRank >= STRENGTH_RANK.Good) {
      const subject = leaders.length > 1 ? leaders.join(' and ') : leaders[0]
      const verb = leaders.length > 1 ? 'have' : 'has'
      notes.push(`${subject} ${verb} the strongest evidence in ${criterion.name.toLowerCase()}`)
    }
  }

  if (notes.length === 0) {
    return 'These candidates show a broadly similar evidence profile across the configured criteria.'
  }
  return `${notes.slice(0, 3).join('. ')}.`
}
