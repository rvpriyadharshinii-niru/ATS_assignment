import { AGENT_DEFINITIONS, NEVER_USED_INFORMATION, REFINEMENTS } from '../data/agents'
import { getCriteria } from '../data/criteria'
import { getInterviewFeedback } from '../data/interviewFeedback'
import { deriveInterviewType } from '../lib/candidateStatus'
import type {
  AgentConfig,
  AgentId,
  AssessmentDraft,
  AssessmentQuestion,
  AssessmentResult,
  AssessmentType,
  CandidateReviewCriterion,
  CandidateReviewOutput,
  CandidateReviewVerdict,
  CoordinationOutput,
  CoordinationScenarioId,
  CriterionFinding,
  InterviewGuide,
  InterviewGuideItem,
  ProposedAgentAction,
  RefinementKey,
  Seniority,
} from '../types/agents'
import type { Candidate, CriterionKey, EvidenceStrength, OpeningId } from '../types/domain'

/*
 * Deterministic stand-ins for agent reasoning. Same inputs → same outputs, every time, so a
 * hiring manager can change one instruction, re-run, and see exactly what that change did.
 * Nothing here calls a model; every output is labelled "Simulated" in the UI.
 */

const STRENGTH_VALUE: Partial<Record<EvidenceStrength, number>> = {
  Strong: 1,
  Good: 0.8,
  Moderate: 0.55,
  Limited: 0.25,
}

export function findingFor(strength: EvidenceStrength): CriterionFinding {
  if (strength === 'Strong' || strength === 'Good') return 'supporting'
  if (strength === 'Moderate') return 'partial'
  if (strength === 'Limited') return 'gap'
  return 'missing'
}

function firstName(candidate: Candidate): string {
  return candidate.name.split(' ')[0]
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function evidenceSource(candidate: Candidate): string {
  if (candidate.stage === 'Interview' || candidate.stage === 'Final') return 'Interview scorecards'
  return 'Resume & application'
}

/** Whether an action is enabled, and if so whether it waits for a person under the current configuration. */
export function actionGate(agentId: AgentId, config: AgentConfig, actionKey: string): { enabled: boolean; requiresApproval: boolean } {
  const def = AGENT_DEFINITIONS[agentId].actions.find((action) => action.key === actionKey)
  const enabled = config.enabledActions.includes(actionKey)
  if (!def) return { enabled: false, requiresApproval: true }
  const requiresApproval = def.risk === 'consequential' || config.autonomy === 'suggest' || config.approvalRequired.includes(actionKey)
  return { enabled, requiresApproval }
}

/** "On its own" means it completes without waiting — only internal actions under routine autonomy that aren't approval-gated. */
export function runsAutomatically(agentId: AgentId, config: AgentConfig, actionKey: string): boolean {
  const gate = actionGate(agentId, config, actionKey)
  return gate.enabled && !gate.requiresApproval && config.autonomy === 'routine'
}

/* ---------------- Candidate Review ---------------- */

export function runCandidateReview(candidate: Candidate, openingId: OpeningId, config: AgentConfig): CandidateReviewOutput {
  const refinements = config.refinements
  const criteria = getCriteria(openingId)
  const source = evidenceSource(candidate)
  const useScreening = config.enabledDataSources.includes('screening')
  const useFeedback = config.enabledDataSources.includes('interview-feedback')

  const rows: CandidateReviewCriterion[] = criteria.map((criterion) => {
    let weight = criterion.priority === 'High' ? 2 : 1
    if (criterion.key === 'aiProductExperience' && refinements.includes('prioritiseAi')) weight += 1
    const evidence = candidate.evidence.find((item) => item.criterionKey === criterion.key)
    const strength: EvidenceStrength = evidence?.strength ?? 'Not available'
    return {
      key: criterion.key,
      name: criterion.name,
      priority: criterion.priority,
      weight,
      strength,
      finding: findingFor(strength),
      detail: evidence?.detail ?? 'No evidence recorded for this criterion yet.',
      source: evidence ? (useScreening ? `${source} · AI screening` : source) : '—',
    }
  })

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0) || 1
  const assessed = rows.filter((row) => STRENGTH_VALUE[row.strength] !== undefined)
  const assessedWeight = assessed.reduce((sum, row) => sum + row.weight, 0)
  const fitRatio = assessedWeight > 0 ? assessed.reduce((sum, row) => sum + row.weight * (STRENGTH_VALUE[row.strength] ?? 0), 0) / assessedWeight : 0
  const coverageRatio = assessedWeight / totalWeight
  const fit = Math.round(fitRatio * 100)
  const coverage = Math.round(coverageRatio * 100)

  const supporting = rows.filter((row) => row.finding === 'supporting')
  const partial = rows.filter((row) => row.finding === 'partial')
  const gaps = rows.filter((row) => row.finding === 'gap')
  const missing = rows.filter((row) => row.finding === 'missing')
  const highPriorityGap = gaps.some((row) => row.priority === 'High')

  const conservative = refinements.includes('conservative')
  const shortlistBar = conservative ? 0.85 : 0.8
  const validateBar = conservative ? 0.65 : 0.6

  const feedback = useFeedback ? getInterviewFeedback(candidate.id) : []
  const mixedFeedback = feedback.some((entry) => entry.sentiment !== 'positive')

  let verdict: CandidateReviewVerdict
  let mustHaveNote: string | undefined
  if (coverageRatio < 0.6) verdict = 'insufficient-evidence'
  else if (fitRatio >= shortlistBar && !(conservative && highPriorityGap)) verdict = 'shortlist'
  else if (fitRatio >= validateBar) verdict = 'shortlist-validate'
  else verdict = 'human-review'

  if (refinements.includes('leadershipMustHave') && (verdict === 'shortlist' || verdict === 'shortlist-validate')) {
    const leadership = rows.find((row) => row.key === 'leadership')
    if (leadership && leadership.finding !== 'supporting') {
      verdict = 'human-review'
      mustHaveNote = `Leadership / ownership is a must-have, and the evidence is ${leadership.finding === 'missing' ? 'missing' : leadership.strength.toLowerCase()}.`
    }
  }

  const verdictLabel: Record<CandidateReviewVerdict, string> = {
    shortlist: 'Recommend for shortlist',
    'shortlist-validate': 'Shortlist, with areas to validate',
    'human-review': 'Flag for your review',
    'insufficient-evidence': 'Not enough evidence to judge',
  }

  const name = firstName(candidate)
  const supportNames = supporting.map((row) => row.name)
  let summary: string
  if (verdict === 'insufficient-evidence') {
    summary = `Only ${assessed.length} of ${rows.length} criteria can be assessed from the information available for ${name}. Missing evidence isn't a negative signal, so the agent won't recommend either way — a person should look at this application.`
  } else if (verdict === 'human-review') {
    summary = mustHaveNote
      ? `${name} has supporting evidence for ${listJoin(supportNames) || 'few criteria'}, but ${mustHaveNote.charAt(0).toLowerCase()}${mustHaveNote.slice(1)} The agent flags this for your judgement instead of shortlisting.`
      : `${name}'s evidence is mixed against the configured priorities. The agent flags this for your judgement and proposes no stage change. It never rejects a candidate.`
  } else {
    summary = `${name} has supporting evidence for ${listJoin(supportNames)}${gaps.length ? `, with limited evidence for ${listJoin(gaps.map((row) => row.name))}` : ''}${missing.length ? `. ${listJoin(missing.map((row) => row.name))} ${missing.length > 1 ? 'are' : 'is'} unclear and worth validating` : ''}.`
  }

  const proposedActions: ProposedAgentAction[] = []
  const pushAction = (actionKey: string, label: string, reason: string) => {
    const gate = actionGate('candidate-review', config, actionKey)
    if (!gate.enabled) return
    proposedActions.push({ label, requiresApproval: gate.requiresApproval, reason })
  }
  const beforeShortlist = candidate.stage === 'Applied' || candidate.stage === 'AI Screened'
  if (verdict === 'shortlist' || verdict === 'shortlist-validate') {
    if (beforeShortlist) {
      pushAction('propose-shortlist', `Move ${name} to HM Review`, 'Changes the candidate’s pipeline stage.')
    } else {
      pushAction('summarise', `Keep ${name} on the shortlist and update the evidence summary`, `${name} is already at ${candidate.stage}; no stage change needed.`)
    }
    if (verdict === 'shortlist-validate' || missing.length > 0) {
      const toValidate = [...gaps, ...missing].map((row) => row.name)
      if (toValidate.length) pushAction('summarise', `Add ${listJoin(toValidate)} to the interview focus areas`, 'Keeps open questions visible to the panel.')
    }
  } else {
    pushAction('flag-review', `Add ${name} to your review queue`, 'No stage change is proposed. The agent never rejects a candidate.')
  }
  if (refinements.includes('requestEvidence') && missing.length > 0) {
    pushAction(
      'request-evidence',
      `Draft a request to ${name} for evidence of ${listJoin(missing.map((row) => row.name))}`,
      'Contacts the candidate, so it is sent only after approval.',
    )
  }

  const informationUsed = [
    { label: 'Application & resume', detail: candidate.currentRole ? `${candidate.currentRole}${candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}` : 'Submitted application' },
    { label: 'Hiring criteria', detail: `${criteria.length} configured criteria for this role, with their priorities` },
  ]
  if (useScreening) informationUsed.push({ label: 'AI screening evidence', detail: `${candidate.evidence.length} criterion-level findings` })
  if (useFeedback && feedback.length) informationUsed.push({ label: 'Interview feedback', detail: `${feedback.length} scorecards (${feedback.map((entry) => entry.reviewer).join(', ')})` })
  if (config.enabledDataSources.includes('pipeline')) informationUsed.push({ label: 'Pipeline stage', detail: `Currently ${candidate.stage}` })

  const informationExcluded = [
    ...(!useFeedback && getInterviewFeedback(candidate.id).length ? ['Interview feedback (turned off in Configuration)'] : []),
    ...(!useScreening ? ['AI screening evidence (turned off in Configuration)'] : []),
    ...NEVER_USED_INFORMATION,
  ]

  const uncertainty: string[] = []
  for (const row of missing) {
    uncertainty.push(
      row.strength === 'Possible'
        ? `${row.name}: the application suggests possible exposure but doesn't confirm it. Treated as missing evidence, not negative.`
        : `${row.name}: ${row.strength === 'Unclear' ? 'evidence is unclear' : 'no evidence available'}. Treated as missing, not negative.`,
    )
  }
  for (const row of partial) uncertainty.push(`${row.name}: moderate evidence; depth isn't established yet.`)
  if (mixedFeedback) uncertainty.push('Interview feedback is mixed across reviewers.')
  if (coverageRatio < 1 && verdict !== 'insufficient-evidence') uncertainty.push(`The recommendation rests on ${coverage}% of the configured criteria weight.`)

  const confidence: CandidateReviewOutput['confidence'] = coverageRatio >= 0.85 && !mixedFeedback ? 'High' : coverageRatio >= 0.6 ? 'Medium' : 'Low'

  return {
    candidateId: candidate.id,
    openingId,
    verdict,
    verdictLabel: verdictLabel[verdict],
    summary,
    criteria: rows,
    fit,
    coverage,
    confidence,
    proposedActions,
    informationUsed,
    informationExcluded,
    uncertainty,
    refinementsApplied: [...refinements],
  }
}

/** Free-text feedback → the structured refinements the simulation understands. */
export function interpretFeedback(text: string): RefinementKey[] {
  return (Object.keys(REFINEMENTS) as RefinementKey[]).filter((key) => REFINEMENTS[key].matches(text))
}

/* ---------------- Assessment ---------------- */

type QuestionSeed = Omit<AssessmentQuestion, 'id' | 'criterionKey'>

const QUESTION_BANK: Partial<Record<CriterionKey, Record<AssessmentType, QuestionSeed>>> = {
  enterpriseSaas: {
    Technical: {
      format: 'Written exercise',
      minutes: 25,
      prompt: 'Structure the information architecture for an enterprise admin console that serves three permission levels. What trade-offs would you make, and why?',
      lookFor: 'A clear permission model, rationale for the hierarchy, and awareness of admin vs. everyday-user needs.',
    },
    Practical: {
      format: 'Take-home exercise',
      minutes: 45,
      prompt: 'Redesign the bulk user-import flow for an enterprise SaaS admin. Share a short flow and the two decisions you would test first.',
      lookFor: 'Handles errors, partial success and audit needs; explains what to validate and how.',
    },
    'Role-specific': {
      format: 'Structured discussion',
      minutes: 15,
      prompt: 'Tell us about an enterprise product where the buyer and the daily user had different needs. How did that shape your design?',
      lookFor: 'Specific example, how competing needs were balanced, and the outcome.',
    },
  },
  complexWorkflows: {
    Technical: {
      format: 'Written exercise',
      minutes: 25,
      prompt: 'Map the states and transitions for a multi-step approval workflow with delegation and escalation. Where do users most often get lost?',
      lookFor: 'Complete state coverage, edge cases (delegation, timeouts), and a reasoned view of user pain points.',
    },
    Practical: {
      format: 'Take-home exercise',
      minutes: 45,
      prompt: 'Simplify the provided 7-step configuration wizard without removing required settings. Show before/after and what you would measure.',
      lookFor: 'Reduces effort without losing capability; sensible defaults; clear success measures.',
    },
    'Role-specific': {
      format: 'Portfolio walkthrough',
      minutes: 20,
      prompt: 'Walk us through the most complex workflow you have redesigned. What did you cut, and how did you know it was safe to cut?',
      lookFor: 'Ownership of the problem, evidence-based decisions, and impact.',
    },
  },
  aiProductExperience: {
    Technical: {
      format: 'Written exercise',
      minutes: 25,
      prompt: 'Design how an AI recommendation shows its evidence and uncertainty so a reviewer can accept, edit or reject it. What happens when the AI is wrong?',
      lookFor: 'Transparent evidence, clear uncertainty, easy human override, and graceful error handling.',
    },
    Practical: {
      format: 'Take-home exercise',
      minutes: 40,
      prompt: 'Sketch the review screen for an AI-generated shortlist where the manager must approve every stage change.',
      lookFor: 'Evidence next to each recommendation, explicit approval step, and no hidden automation.',
    },
    'Role-specific': {
      format: 'Structured discussion',
      minutes: 15,
      prompt: 'Describe an AI-assisted feature you shipped. How did you design for trust, errors and human override?',
      lookFor: 'Hands-on AI product work, concrete trust patterns, and lessons learned.',
    },
  },
  designSystems: {
    Technical: {
      format: 'Written exercise',
      minutes: 15,
      prompt: 'A product team wants a one-off variant of a shared table component. How do you decide whether to extend the system or decline?',
      lookFor: 'Principled criteria for system changes, and how the decision is communicated.',
    },
    Practical: {
      format: 'Take-home exercise',
      minutes: 35,
      prompt: 'Audit the three provided form screens and propose the shared components and tokens you would extract.',
      lookFor: 'Spots inconsistency, proposes reusable components with sensible APIs and tokens.',
    },
    'Role-specific': {
      format: 'Portfolio walkthrough',
      minutes: 15,
      prompt: 'How have you contributed to or governed a design system? What did adoption look like across teams?',
      lookFor: 'Scope of contribution vs. ownership, and adoption outcomes.',
    },
  },
  leadership: {
    Technical: {
      format: 'Written exercise',
      minutes: 15,
      prompt: 'You and engineering disagree on scope two weeks before launch. Outline how you would frame the trade-off for the product lead.',
      lookFor: 'Balanced framing, clear recommendation, and ownership of the decision process.',
    },
    Practical: {
      format: 'Take-home exercise',
      minutes: 30,
      prompt: 'Write a one-page plan for leading a cross-team redesign: goals, decision owners, and how you would bring two junior designers along.',
      lookFor: 'Clear ownership, realistic plan, and deliberate support for other designers.',
    },
    'Role-specific': {
      format: 'Structured discussion',
      minutes: 15,
      prompt: 'Tell us about an initiative you owned end-to-end. What was the scope, who did you lead, and what changed because of it?',
      lookFor: 'Scale of responsibility, whether they formally led others, and measurable impact.',
    },
  },
}

const GENERIC_QUESTION: Partial<Record<CriterionKey, QuestionSeed>> = {
  communicationSkills: {
    format: 'Written exercise',
    minutes: 15,
    prompt: 'Write a short design rationale for a decision stakeholders disagreed with, aimed at a non-design audience.',
    lookFor: 'Clarity, structure, and adapting to the audience.',
  },
  crossFunctionalCollaboration: {
    format: 'Structured discussion',
    minutes: 15,
    prompt: 'Describe a release where product, engineering and research had to change plans together. What was your role?',
    lookFor: 'Specific collaboration behaviours and shared outcomes.',
  },
  mentorship: {
    format: 'Structured discussion',
    minutes: 15,
    prompt: 'Tell us about a designer you helped grow. What did you do, and what changed for them?',
    lookFor: 'Deliberate mentoring, specific actions, and observable growth.',
  },
}

const SENIORITY_EXPECTATION: Record<Seniority, string> = {
  'Mid-level': 'At mid-level, expect sound execution, with guidance on bigger trade-offs.',
  Senior: 'At senior level, expect independent trade-off reasoning and a clear rationale.',
  Lead: 'At lead level, also expect how they would set direction and bring others along.',
}

export function generateAssessment(openingId: OpeningId, type: AssessmentType, seniority: Seniority, criteriaKeys: CriterionKey[]): AssessmentDraft {
  const questions: AssessmentQuestion[] = criteriaKeys
    .flatMap((key, index): AssessmentQuestion[] => {
      const seed = QUESTION_BANK[key]?.[type] ?? GENERIC_QUESTION[key]
      if (!seed) return []
      return [{ ...seed, id: `q-${key}-${index}`, criterionKey: key, lookFor: `${seed.lookFor} ${SENIORITY_EXPECTATION[seniority]}` }]
    })
  return { openingId, type, seniority, criteria: criteriaKeys, questions, editedSinceApproval: false }
}

const PROTECTED_TERMS =
  /\b(age|how old|young|married|marital|spouse|children|kids|family plans|pregnan\w*|religio\w*|church|nationality|citizenship|ethnic\w*|race|gender|disab\w*|health condition|retire\w*|born)\b/i

export interface QualityCheck {
  label: string
  ok: boolean
  detail: string
}

export function checkAssessment(draft: AssessmentDraft, openingId: OpeningId): QualityCheck[] {
  const criteria = getCriteria(openingId)
  const total = draft.questions.reduce((sum, question) => sum + question.minutes, 0)
  const unlinked = draft.questions.filter((question) => !question.criterionKey)
  const flagged = draft.questions.filter((question) => PROTECTED_TERMS.test(question.prompt))
  const uncoveredHigh = criteria.filter((criterion) => criterion.priority === 'High' && !draft.questions.some((question) => question.criterionKey === criterion.key))
  const empty = draft.questions.filter((question) => question.prompt.trim().length < 15)
  return [
    {
      label: 'Every question links to a job requirement',
      ok: unlinked.length === 0,
      detail: unlinked.length ? `${unlinked.length} question${unlinked.length > 1 ? 's are' : ' is'} not linked to a requirement and won't be evaluated.` : 'All questions map to a hiring criterion.',
    },
    {
      label: 'No questions about personal characteristics',
      ok: flagged.length === 0,
      detail: flagged.length
        ? `Question ${draft.questions.indexOf(flagged[0]) + 1} may touch a protected characteristic. Rephrase it around the job.`
        : 'No references to age, family, religion, nationality, health or similar.',
    },
    {
      label: 'High-priority criteria covered',
      ok: uncoveredHigh.length === 0,
      detail: uncoveredHigh.length ? `Not covered: ${uncoveredHigh.map((criterion) => criterion.name).join(', ')}.` : 'Each High-priority criterion has at least one question.',
    },
    {
      label: 'Reasonable length for candidates',
      ok: total <= 120,
      detail: `${total} minutes in total${total > 120 ? ' — over the 2-hour limit in the agent’s instructions.' : '.'}`,
    },
    {
      label: 'Questions are complete',
      ok: empty.length === 0 && draft.questions.length > 0,
      detail: draft.questions.length === 0 ? 'Add at least one question.' : empty.length ? `${empty.length} question${empty.length > 1 ? 's look' : ' looks'} incomplete.` : 'Every question has a full prompt.',
    },
  ]
}

const RATING_BY_FINDING: Record<CriterionFinding, AssessmentResult['items'][number]['rating']> = {
  supporting: 'Meets',
  partial: 'Partially meets',
  gap: 'Partially meets',
  missing: 'Not evidenced',
}

/** Simulated submission: the candidate's answers are modelled on their recorded evidence for each requirement. */
export function summariseAssessment(draft: AssessmentDraft, candidate: Candidate, title: string): AssessmentResult {
  const criteria = getCriteria(draft.openingId)
  const items = draft.questions.map((question) => {
    const criterionName = criteria.find((criterion) => criterion.key === question.criterionKey)?.name
    if (!question.criterionKey) {
      return { questionId: question.id, prompt: question.prompt, criterionName, rating: 'Not evaluated' as const, evidence: 'Not linked to a job requirement, so it is not evaluated.' }
    }
    const evidence = candidate.evidence.find((item) => item.criterionKey === question.criterionKey)
    const finding = evidence ? findingFor(evidence.strength) : 'missing'
    const rating = RATING_BY_FINDING[finding]
    const text =
      rating === 'Meets'
        ? `Response addresses what we look for. Consistent with profile evidence: “${evidence?.detail}”`
        : rating === 'Partially meets'
          ? `Response covers part of what we look for; depth is limited. Profile evidence: “${evidence?.detail}”`
          : 'The response does not show evidence for this requirement. This is missing evidence, not a negative finding — consider probing it in interview.'
    return { questionId: question.id, prompt: question.prompt, criterionName, rating, evidence: text }
  })
  const evaluated = items.filter((item) => item.rating !== 'Not evaluated')
  const meets = evaluated.filter((item) => item.rating === 'Meets').length
  const partial = evaluated.filter((item) => item.rating === 'Partially meets').length
  const notEvidenced = evaluated.filter((item) => item.rating === 'Not evidenced').length
  const summary = `${firstName(candidate)}'s submission meets what we look for on ${meets} of ${evaluated.length} evaluated question${evaluated.length === 1 ? '' : 's'}${partial ? `, partially on ${partial}` : ''}${notEvidenced ? `, with ${notEvidenced} not evidenced` : ''}. This summary supports your review; it is not a pass/fail or hiring decision.`
  return { candidateId: candidate.id, title, status: 'Completed', submittedLabel: 'Submitted 1d ago', items, summary }
}

export function assessmentTitle(draft: Pick<AssessmentDraft, 'type' | 'seniority'>): string {
  return `${draft.seniority} Product Designer · ${draft.type} assessment`
}

/* ---------------- Interview Preparation ---------------- */

const GUIDE_QUESTIONS: Partial<Record<CriterionKey, { validate: string[]; explore: string; listenFor: string }>> = {
  enterpriseSaas: {
    validate: [
      'Tell me about the most complex enterprise customer you designed for. Who were the users, and who bought the product?',
      'How did enterprise constraints like permissions, compliance or admin needs change your design decisions?',
    ],
    explore: 'Pick one enterprise project from your background. What would you do differently today, and why?',
    listenFor: 'Specific products and users, how constraints shaped decisions, and their personal contribution.',
  },
  complexWorkflows: {
    validate: [
      'Walk me through a multi-step workflow you owned. Where did users struggle, and how did you find out?',
      'How did you decide what to simplify versus keep configurable?',
    ],
    explore: 'In your most complex workflow, which edge case was hardest to design for?',
    listenFor: 'End-to-end ownership, evidence-led simplification, and handling of edge cases.',
  },
  aiProductExperience: {
    validate: [
      'Have you designed experiences where users review or act on AI-generated output? Walk me through one.',
      'How would you show AI uncertainty so a user knows when to trust a recommendation?',
    ],
    explore: 'What did you learn about trust and human override from the AI-assisted work you described?',
    listenFor: 'Hands-on AI product work versus adjacent exposure, and concrete trust patterns.',
  },
  designSystems: {
    validate: [
      'What was your role in the design system you worked with — contributor, maintainer or owner?',
      'Tell me about a time you changed a shared component. How did you manage the impact on other teams?',
    ],
    explore: 'How did you measure whether the design system was working for product teams?',
    listenFor: 'Contribution vs. ownership, governance, and adoption outcomes.',
  },
  leadership: {
    validate: [
      'Tell me about an initiative you led end-to-end. What was the scope, and who was involved?',
      'Have you formally led or mentored other designers? What did that look like week to week?',
    ],
    explore: 'Describe a difficult decision you owned as a lead. How did you bring others along?',
    listenFor: 'Scale of responsibility, formal vs. informal leadership, and outcomes they drove.',
  },
  communicationSkills: {
    validate: ['How do you present design rationale to stakeholders who disagree?', 'Share an example where your communication changed a decision.'],
    explore: 'How do you adapt a design story for executives versus engineers?',
    listenFor: 'Clarity, structure and audience awareness.',
  },
  crossFunctionalCollaboration: {
    validate: ['Describe how you work with product and engineering from discovery to release.', 'Tell me about a disagreement with engineering and how it was resolved.'],
    explore: 'What does a healthy design–engineering partnership look like to you?',
    listenFor: 'Concrete collaboration habits and shared ownership.',
  },
  mentorship: {
    validate: ['Tell me about a designer you helped grow.', 'How do you give feedback on work that is not ready?'],
    explore: 'What has mentoring others taught you about your own practice?',
    listenFor: 'Deliberate mentoring and specific, observable impact.',
  },
}

const CONSISTENT_QUESTIONS = [
  'What attracted you to this role, and what would you want to accomplish in your first six months?',
  'Tell me about a project that did not go as planned. What did you learn?',
  'What questions do you have for us about the team, the product or how we work?',
]

export const ROUND_TYPES: { label: string; minutes: number }[] = [
  { label: 'Portfolio review', minutes: 60 },
  { label: 'Product interview', minutes: 45 },
  { label: 'Design interview', minutes: 45 },
  { label: 'Panel interview', minutes: 60 },
]

export function generateInterviewGuide(candidate: Candidate, roundType: string, config: AgentConfig): InterviewGuide {
  const criteria = getCriteria(candidate.openingId)
  const minutes = ROUND_TYPES.find((round) => round.label === roundType)?.minutes ?? 45
  const useFeedback = config.enabledDataSources.includes('interview-feedback')
  const validate: InterviewGuideItem[] = []
  const explore: InterviewGuideItem[] = []
  const source = evidenceSource(candidate)

  for (const criterion of criteria) {
    const bank = GUIDE_QUESTIONS[criterion.key]
    if (!bank) continue
    const evidence = candidate.evidence.find((item) => item.criterionKey === criterion.key)
    const finding = evidence ? findingFor(evidence.strength) : 'missing'
    const base = {
      criterionKey: criterion.key,
      requirement: `${criterion.name} · ${criterion.priority} priority`,
      candidateEvidence: evidence ? `${evidence.strength}: ${evidence.detail}` : 'No evidence recorded yet.',
      evidenceSource: evidence ? source : 'Not available',
      listenFor: bank.listenFor,
    }
    if (finding === 'supporting') {
      explore.push({ ...base, why: 'Evidence is already supportive — check depth and their personal contribution rather than re-asking basics.', questions: [bank.explore] })
    } else {
      validate.push({
        ...base,
        why:
          finding === 'missing'
            ? 'Evidence is missing or unclear. Ask openly — absence of evidence is not a negative signal.'
            : finding === 'gap'
              ? 'Evidence so far is limited. Give the candidate a fair chance to show depth.'
              : 'Evidence is moderate. Establish the depth and scope of their experience.',
        questions: bank.validate,
      })
    }
  }

  const priorFeedback = useFeedback ? getInterviewFeedback(candidate.id).map((entry) => ({ reviewer: entry.reviewer, quote: entry.quote })) : []
  const informationUsed = [
    `Hiring criteria for this role (${criteria.length})`,
    candidate.evidence.length ? `Candidate evidence (${candidate.evidence.length} criteria, from ${source.toLowerCase()})` : 'Candidate evidence: none recorded yet',
    ...(priorFeedback.length ? [`Earlier interview feedback (${priorFeedback.length} reviewers)`] : []),
    `Round: ${roundType}, ${minutes} minutes`,
  ]

  return {
    candidateId: candidate.id,
    roundType,
    minutes,
    validate,
    explore,
    consistent: CONSISTENT_QUESTIONS,
    priorFeedback,
    informationUsed,
    limitedEvidence: candidate.evidence.length === 0,
  }
}

/* ---------------- Interview Coordination ---------------- */

/** A weekday label N business days from today, e.g. "Thu, Oct 15". */
export function businessDayLabel(offset: number, from = new Date()): string {
  const date = new Date(from)
  let remaining = offset
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const COORDINATION_SCENARIOS: { id: CoordinationScenarioId; label: string; candidateId: string; description: string }[] = [
  {
    id: 'overdue-feedback',
    label: 'Overdue interviewer feedback',
    candidateId: 'rohan-das',
    description: 'Rohan Das interviewed 4 days ago and the Design Lead’s scorecard is still outstanding.',
  },
  {
    id: 'schedule-final',
    label: 'Schedule a final round',
    candidateId: 'neha-kapoor',
    description: 'Neha Kapoor is in Final and needs a time that works for a three-person panel.',
  },
  {
    id: 'conflict',
    label: 'Resolve a calendar conflict',
    candidateId: 'ishaan-kapoor',
    description: 'A panelist accepted a conflicting meeting over Ishaan Kapoor’s scheduled interview.',
  },
]

export function runCoordinationScenario(scenarioId: CoordinationScenarioId, candidate: Candidate, config: AgentConfig): CoordinationOutput {
  const name = firstName(candidate)
  const useCalendars = config.enabledDataSources.includes('calendars')
  const reminderGate = actionGate('interview-coordination', config, 'remind-interviewers')
  const reminderAuto = runsAutomatically('interview-coordination', config, 'remind-interviewers')

  if (scenarioId === 'overdue-feedback') {
    return {
      scenarioId,
      candidateId: candidate.id,
      detected: [
        `${candidate.name} is in ${candidate.stage}; last round was ${candidate.waitingDays ?? 4} days ago.`,
        'Design Lead’s scorecard is outstanding. The team target in the instructions is 2 business days.',
        `${name} hasn’t had an update since the interview.`,
      ],
      calendar: [],
      plan: [
        ...(reminderGate.enabled ? [{ step: `Remind the Design Lead to submit feedback for ${name}${reminderAuto ? ' (completes automatically — routine internal step)' : ''}`, requiresApproval: !reminderAuto }] : []),
        { step: `Send ${name} a short status update`, requiresApproval: true },
        { step: 'Check again in 2 business days and tell you if feedback is still missing', requiresApproval: false },
      ],
      messages: [
        ...(reminderGate.enabled
          ? [
              {
                id: 'm-reminder',
                audience: 'Interviewer' as const,
                recipient: 'Design Lead',
                subject: `Feedback needed: ${candidate.name} · Senior Product Designer`,
                body: `Hi,\n\nYour scorecard for ${candidate.name}'s interview is still outstanding (${candidate.waitingDays ?? 4} days). Could you add it by end of day tomorrow so we can give ${name} a decision on next steps?\n\nThanks,\nHireFlow on behalf of Priya`,
                external: false,
              },
            ]
          : []),
        {
          id: 'm-update',
          audience: 'Candidate',
          recipient: candidate.name,
          subject: 'An update on your Senior Product Designer application',
          body: `Hi ${name},\n\nThank you again for your time in the interview. We're gathering feedback from the panel and expect to share next steps with you by ${businessDayLabel(3)}.\n\nBest regards,\nPriya Sharma\nHiring Manager`,
          external: true,
        },
      ],
    }
  }

  if (scenarioId === 'schedule-final') {
    const slots = [`${businessDayLabel(2)} · 10:30 AM`, `${businessDayLabel(3)} · 2:00 PM`, `${businessDayLabel(4)} · 11:00 AM`]
    return {
      scenarioId,
      candidateId: candidate.id,
      detected: [
        `${candidate.name} is in Final: “${candidate.interviewStatus ?? 'Final interview to schedule'}”.`,
        'Panel: Priya, Design Lead, Product Lead (from the role’s interview plan).',
        useCalendars ? 'Checked free/busy for the next 5 business days.' : 'Interviewer calendars are turned off in Configuration — slots are not checked.',
      ],
      calendar: useCalendars
        ? [
            {
              slot: slots[0],
              attendees: [
                { name: 'Priya', available: true },
                { name: 'Design Lead', available: true },
                { name: 'Product Lead', available: false, note: 'Busy' },
              ],
            },
            {
              slot: slots[1],
              attendees: [
                { name: 'Priya', available: true },
                { name: 'Design Lead', available: true },
                { name: 'Product Lead', available: true },
              ],
            },
            {
              slot: slots[2],
              attendees: [
                { name: 'Priya', available: true },
                { name: 'Design Lead', available: false, note: 'Out of office' },
                { name: 'Product Lead', available: true },
              ],
            },
          ]
        : [],
      plan: [
        { step: useCalendars ? `Hold ${slots[1]} on the panel’s calendars` : 'Ask you to pick a time manually', requiresApproval: !runsAutomatically('interview-coordination', config, 'propose-slots') },
        { step: `Send ${name} an invitation with the proposed time and one alternative`, requiresApproval: true },
      ],
      messages: [
        {
          id: 'm-invite',
          audience: 'Candidate',
          recipient: candidate.name,
          subject: 'Final interview · Senior Product Designer',
          body: `Hi ${name},\n\nWe'd love to invite you to a final 60-minute interview with Priya, our Design Lead and Product Lead.\n\nProposed time: ${useCalendars ? slots[1] : '[time to confirm]'}\nAlternative: ${businessDayLabel(5)} · 3:30 PM\n\nPlease reply with the time that works best, or suggest another.\n\nBest regards,\nPriya Sharma\nHiring Manager`,
          external: true,
        },
      ],
    }
  }

  const original = `${businessDayLabel(1)} · 11:00 AM`
  const alternatives = [`${businessDayLabel(1)} · 3:30 PM`, `${businessDayLabel(2)} · 10:30 AM`]
  const roundType = deriveInterviewType(candidate)
  return {
    scenarioId,
    candidateId: candidate.id,
    detected: [
      `${candidate.name}'s ${roundType.toLowerCase()} is scheduled for ${original}.`,
      useCalendars ? 'The Design Lead accepted a conflicting meeting at the same time.' : 'Interviewer calendars are turned off — the conflict can’t be confirmed.',
      'The candidate has not been told about any change yet.',
    ],
    calendar: useCalendars
      ? [
          {
            slot: `${original} (current)`,
            attendees: [
              { name: 'Priya', available: true },
              { name: 'Design Lead', available: false, note: 'Conflict' },
            ],
          },
          ...alternatives.map((slot) => ({ slot, attendees: [{ name: 'Priya', available: true }, { name: 'Design Lead', available: true }] })),
        ]
      : [],
    plan: [
      { step: `Ask the Design Lead to confirm whether the conflict can move`, requiresApproval: !reminderAuto },
      { step: `If not, offer ${name} ${alternatives.join(' or ')}`, requiresApproval: true },
    ],
    messages: [
      {
        id: 'm-panel',
        audience: 'Interviewer',
        recipient: 'Design Lead',
        subject: `Conflict with ${candidate.name}'s ${roundType.toLowerCase()}`,
        body: `Hi,\n\nYou have a meeting overlapping ${candidate.name}'s ${roundType.toLowerCase()} at ${original}. Can it move? If not, ${alternatives[0]} and ${alternatives[1]} work for the rest of the panel.\n\nThanks,\nHireFlow on behalf of Priya`,
        external: false,
      },
      {
        id: 'm-reschedule',
        audience: 'Candidate',
        recipient: candidate.name,
        subject: `Rescheduling your ${roundType.toLowerCase()}`,
        body: `Hi ${name},\n\nWe're sorry — a panel member is no longer available at ${original}. Would either of these work instead?\n\n• ${alternatives[0]}\n• ${alternatives[1]}\n\nApologies for the change, and thank you for your flexibility.\n\nBest regards,\nPriya Sharma\nHiring Manager`,
        external: true,
      },
    ],
  }
}
