import type { InterviewFeedbackEntry } from '../types/copilot'

/**
 * Interviewer feedback surfaced in the Copilot candidate-review flow, keyed by
 * candidate id. Only defined for candidates the prototype gives a real
 * interview scorecard (see candidates.ts) — never fabricated for the rest.
 */
const interviewFeedbackByCandidateId: Record<string, InterviewFeedbackEntry[]> = {
  'nisha-verma': [
    { reviewer: 'Design Lead', sentiment: 'positive', quote: 'Strong systems thinking and clear rationale.' },
    {
      reviewer: 'Product Lead',
      sentiment: 'mixed',
      quote: 'Strong execution. Would validate ownership at a broader product level.',
    },
  ],
  'rohan-das': [
    {
      reviewer: 'Product Lead',
      sentiment: 'positive',
      quote: 'Confident owner of ambiguous problems, strong stakeholder management.',
    },
    { reviewer: 'Design Lead', sentiment: 'mixed', quote: 'Solid craft. Hasn’t shown much AI-specific product work yet.' },
  ],
  'aarav-sethi': [
    { reviewer: 'Engineering Manager', sentiment: 'positive', quote: 'Strong partner to engineering; ran a crisp scoping discussion during the case exercise.' },
    { reviewer: 'Engineering Manager', sentiment: 'mixed', quote: 'Would like to see more depth on qualitative discovery beyond structured interviews.' },
  ],
}

export function getInterviewFeedback(candidateId: string): InterviewFeedbackEntry[] {
  return interviewFeedbackByCandidateId[candidateId] ?? []
}
