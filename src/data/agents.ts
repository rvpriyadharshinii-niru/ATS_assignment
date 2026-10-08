import type { AgentActionDef, AgentDataSourceDef, AgentId, AgentRecord, AutonomyLevel, RefinementKey } from '../types/agents'

/**
 * The four supervised agents in this post-assignment exploration. Definitions are static (what
 * the agent *can* do); AgentRecord.config is what Priya has chosen it *may* do, and lives in the
 * agent store so Configuration, Testing and "Run now" all read the same settings.
 */
export interface AgentDefinition {
  id: AgentId
  name: string
  shortDescription: string
  capabilities: string[]
  actions: AgentActionDef[]
  dataSources: AgentDataSourceDef[]
  /** Hard boundaries, shown as "Never does" — not configurable. */
  guardrails: string[]
  /** Whether the agent evaluates against the role's hiring criteria (shows them in Configuration). */
  usesCriteria: boolean
}

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  'candidate-review': {
    id: 'candidate-review',
    name: 'Candidate Review Agent',
    shortDescription: 'Reviews incoming applications against your hiring criteria and prepares an evidence-backed shortlist.',
    capabilities: [
      'Reviews incoming applications against configured job requirements',
      'Identifies strong matches and gaps',
      'Prepares an evidence-backed shortlist',
      'Flags candidates requiring human review',
    ],
    actions: [
      { key: 'summarise', label: 'Add evidence summaries to candidate profiles', description: 'Writes a criterion-by-criterion summary on the candidate profile.', risk: 'internal' },
      { key: 'flag-review', label: 'Flag candidates for human review', description: 'Adds a candidate to your review queue when evidence is thin or mixed.', risk: 'internal' },
      { key: 'propose-shortlist', label: 'Propose shortlist moves to HM Review', description: 'Moves a candidate to HM Review once you approve.', risk: 'consequential' },
      { key: 'request-evidence', label: 'Draft requests for missing information', description: 'Drafts an email asking the candidate for a portfolio or detail. Sent only after approval.', risk: 'consequential' },
    ],
    dataSources: [
      { key: 'application', label: 'Application & resume', description: 'Work history, role descriptions and portfolio links the candidate submitted.', required: true },
      { key: 'criteria', label: 'Hiring criteria', description: 'The role’s configured criteria and priorities.', required: true },
      { key: 'screening', label: 'AI screening evidence', description: 'Criterion-level evidence already recorded in HireFlow.' },
      { key: 'interview-feedback', label: 'Interview feedback', description: 'Scorecards from earlier rounds, where they exist.' },
      { key: 'pipeline', label: 'Pipeline stage & activity', description: 'Current stage and history, so it doesn’t re-propose finished moves.' },
    ],
    guardrails: ['Reject or deprioritise a candidate', 'Treat missing evidence as negative evidence', 'Use protected or personal characteristics'],
    usesCriteria: true,
  },
  'interview-coordination': {
    id: 'interview-coordination',
    name: 'Interview Coordination Agent',
    shortDescription: 'Tracks interview stages and pending feedback, spots delays and conflicts, and drafts invitations and follow-ups.',
    capabilities: [
      'Tracks interview stages and pending feedback',
      'Identifies scheduling conflicts and delays',
      'Prepares interview invitations and follow-up messages',
      'Requires approval before external communication',
    ],
    actions: [
      { key: 'track', label: 'Track stages and overdue feedback', description: 'Watches the Interview and Final stages for delays.', risk: 'internal' },
      { key: 'remind-interviewers', label: 'Send feedback reminders to interviewers', description: 'Internal nudges to colleagues with outstanding scorecards.', risk: 'internal' },
      { key: 'propose-slots', label: 'Propose interview slots', description: 'Checks panel calendars and suggests times.', risk: 'internal' },
      { key: 'invite', label: 'Send interview invitations', description: 'Emails the candidate a proposed time. Sent only after approval.', risk: 'consequential' },
      { key: 'candidate-update', label: 'Send status updates to candidates', description: 'Keeps waiting candidates informed. Sent only after approval.', risk: 'consequential' },
    ],
    dataSources: [
      { key: 'pipeline', label: 'Pipeline stage & interview status', description: 'Who is in Interview or Final and what they are waiting on.', required: true },
      { key: 'feedback-status', label: 'Feedback status', description: 'Which scorecards are outstanding and for how long.', required: true },
      { key: 'calendars', label: 'Interviewer calendars', description: 'Free/busy only — never meeting contents. Simulated in this prototype.' },
      { key: 'contact', label: 'Candidate contact details', description: 'Email address used for approved messages.' },
      { key: 'templates', label: 'Email templates', description: 'Your team’s invitation and follow-up wording.' },
    ],
    guardrails: ['Contact a candidate without your approval', 'Advance or reject a candidate', 'Share interview feedback with the candidate'],
    usesCriteria: false,
  },
  assessment: {
    id: 'assessment',
    name: 'Assessment Agent',
    shortDescription: 'Drafts role-specific assessments from the job, skills and seniority, and summarises results with evidence.',
    capabilities: [
      'Creates draft assessments from the job description, skills and seniority',
      'Supports technical, practical and role-specific assessments',
      'Lets you review, edit and approve every question',
      'Summarises results with evidence, without making hiring decisions',
    ],
    actions: [
      { key: 'draft-assessment', label: 'Draft assessments for a role', description: 'Creates a draft for you to review and edit.', risk: 'internal' },
      { key: 'summarise-results', label: 'Summarise submitted results', description: 'Adds an evidence summary to the candidate profile.', risk: 'internal' },
      { key: 'publish', label: 'Publish assessments to candidates', description: 'Sends an approved assessment to a candidate. Sent only after approval.', risk: 'consequential' },
    ],
    dataSources: [
      { key: 'criteria', label: 'Job requirements & hiring criteria', description: 'Skills and priorities the questions are built from.', required: true },
      { key: 'seniority', label: 'Role seniority', description: 'Sets the depth expected in answers.', required: true },
      { key: 'library', label: 'Team assessment library', description: 'Previously approved questions your team reuses.' },
      { key: 'submissions', label: 'Candidate submissions', description: 'Used only to summarise results against each requirement.' },
    ],
    guardrails: ['Publish an assessment without your approval', 'Give a pass/fail or hiring decision', 'Ask questions unrelated to the job'],
    usesCriteria: true,
  },
  'interview-prep': {
    id: 'interview-prep',
    name: 'Interview Preparation Agent',
    shortDescription: 'Prepares structured interview guides for shortlisted candidates, linked to job requirements and evidence.',
    capabilities: [
      'Prepares structured interview guides for shortlisted candidates',
      'Suggests role-relevant questions and areas to validate',
      'Uses the candidate’s available evidence and job requirements',
      'Helps interviewers prepare without making assumptions',
    ],
    actions: [
      { key: 'draft-guide', label: 'Prepare interview guides', description: 'Drafts a guide before each scheduled interview.', risk: 'internal' },
      { key: 'suggest-questions', label: 'Suggest areas to validate', description: 'Highlights unclear or limited evidence to probe.', risk: 'internal' },
      { key: 'share-panel', label: 'Share guides with the interview panel', description: 'Posts the guide to the panel’s interview kit.', risk: 'internal' },
    ],
    dataSources: [
      { key: 'criteria', label: 'Hiring criteria', description: 'Every question links back to a requirement.', required: true },
      { key: 'evidence', label: 'Candidate evidence & resume', description: 'What is already known, so the panel validates rather than repeats.', required: true },
      { key: 'interview-feedback', label: 'Earlier interview feedback', description: 'Open questions from previous rounds.' },
      { key: 'schedule', label: 'Interview schedule', description: 'Round type and length.' },
    ],
    guardrails: ['Make assumptions about a candidate beyond the evidence', 'Suggest questions about personal circumstances', 'Score or rank candidates'],
    usesCriteria: true,
  },
}

export const AGENT_ORDER: AgentId[] = ['candidate-review', 'interview-coordination', 'assessment', 'interview-prep']

/** Information no agent ever reads or infers, regardless of configuration. */
export const NEVER_USED_INFORMATION = [
  'Age, date of birth, or graduation year as an age signal',
  'Gender, marital or family status',
  'Race, ethnicity, nationality or religion',
  'Health or disability information',
  'Photos, or names used as an identity signal',
  'Personal social media outside the professional profile',
]

export const AUTONOMY_LEVELS: { key: AutonomyLevel; label: string; description: string }[] = [
  {
    key: 'suggest',
    label: 'Suggest only',
    description: 'Surfaces findings and recommendations. Every action, even internal ones, waits for you.',
  },
  {
    key: 'prepare',
    label: 'Prepare for approval',
    description: 'Prepares shortlists, drafts and guides on its own. You approve anything consequential before it happens.',
  },
  {
    key: 'routine',
    label: 'Handle routine steps',
    description: 'Also completes low-risk internal steps (like interviewer reminders) automatically. Consequential actions still need you.',
  },
]

export const REFINEMENTS: Record<RefinementKey, { label: string; instruction: string; matches: (text: string) => boolean }> = {
  prioritiseAi: {
    label: 'Weight AI product experience more heavily',
    instruction: 'Give AI product experience more weight than other High-priority criteria.',
    matches: (text) => /\b(ai|artificial intelligence)\b/i.test(text) && /(more|higher|heav|important|priorit|weight)/i.test(text),
  },
  leadershipMustHave: {
    label: 'Treat leadership as a must-have',
    instruction: 'Do not recommend a shortlist unless leadership / ownership is supported by evidence; flag for review instead.',
    matches: (text) => /(leader|ownership)/i.test(text) && /(must|required|essential|mandatory|need)/i.test(text),
  },
  conservative: {
    label: 'Be more conservative before shortlisting',
    instruction: 'Raise the bar for a shortlist recommendation, and never shortlist outright when a High-priority criterion shows a gap.',
    matches: (text) => /(conservative|strict|cautious|careful|higher bar|fewer)/i.test(text),
  },
  requestEvidence: {
    label: 'Ask for missing evidence instead of guessing',
    instruction: 'When a criterion is unclear or missing, propose a request to the candidate for that information.',
    matches: (text) => /\b(ask|request|follow.?up|clarif)/i.test(text),
  },
}

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

export function seedAgentRecords(now: number): Record<AgentId, AgentRecord> {
  return {
    'candidate-review': {
      id: 'candidate-review',
      status: 'active',
      version: 3,
      updatedAt: now - 2 * DAY,
      lastRunAt: now - 2 * HOUR,
      config: {
        objective:
          'Review incoming Senior Product Designer applications against the configured hiring criteria, prepare an evidence-backed shortlist for my review, and flag anyone whose evidence is too thin to judge. Never reject a candidate.',
        openingIds: ['senior-product-designer'],
        enabledDataSources: ['application', 'criteria', 'screening', 'pipeline'],
        instructions:
          'Evaluate each application only against the role’s configured hiring criteria and their priorities. Cite the evidence behind every finding. Treat unclear or missing information as something to validate, not as a negative signal. Recommend; leave every stage decision to the hiring manager.',
        enabledActions: ['summarise', 'flag-review', 'propose-shortlist', 'request-evidence'],
        approvalRequired: [],
        autonomy: 'prepare',
        refinements: [],
        notes: [],
      },
    },
    'interview-coordination': {
      id: 'interview-coordination',
      status: 'active',
      version: 2,
      updatedAt: now - 5 * DAY,
      lastRunAt: now - 1 * HOUR,
      config: {
        objective:
          'Keep Senior Product Designer and Product Manager interviews moving: chase overdue feedback, spot scheduling conflicts and draft invitations and follow-ups for my approval.',
        openingIds: ['senior-product-designer', 'product-manager'],
        enabledDataSources: ['pipeline', 'feedback-status', 'calendars', 'contact', 'templates'],
        instructions:
          'Feedback is overdue after 2 business days. Prefer slots where the whole panel is free; never double-book. Keep candidate messages short, warm and specific about next steps. Never share interview feedback with candidates.',
        enabledActions: ['track', 'remind-interviewers', 'propose-slots', 'invite', 'candidate-update'],
        approvalRequired: [],
        autonomy: 'routine',
        refinements: [],
        notes: [],
      },
    },
    assessment: {
      id: 'assessment',
      status: 'draft',
      version: 1,
      updatedAt: now - 2 * DAY,
      config: {
        objective:
          'Draft practical, role-specific assessments for Senior Product Designer candidates at HM Review, and summarise submitted work against each requirement for my review.',
        openingIds: ['senior-product-designer'],
        enabledDataSources: ['criteria', 'seniority', 'library', 'submissions'],
        instructions:
          'Every question must map to a hiring criterion. Keep the total under 2 hours. Summarise results with evidence from the submission and say when something is not evidenced; never give a pass/fail verdict.',
        enabledActions: ['draft-assessment', 'summarise-results', 'publish'],
        approvalRequired: [],
        autonomy: 'prepare',
        refinements: [],
        notes: [],
      },
    },
    'interview-prep': {
      id: 'interview-prep',
      status: 'paused',
      version: 2,
      updatedAt: now - 3 * DAY,
      lastRunAt: now - 3 * DAY,
      config: {
        objective:
          'Before each Senior Product Designer interview, prepare a structured guide that helps the panel validate open questions from the candidate’s evidence.',
        openingIds: ['senior-product-designer'],
        enabledDataSources: ['criteria', 'evidence', 'interview-feedback', 'schedule'],
        instructions:
          'Link every question to a job requirement. Focus on what is unclear or limited in the evidence. Ask every candidate the same core questions so comparisons are fair. Never assume anything the evidence doesn’t show.',
        enabledActions: ['draft-guide', 'suggest-questions', 'share-panel'],
        approvalRequired: ['share-panel'],
        autonomy: 'prepare',
        refinements: [],
        notes: [],
      },
    },
  }
}
