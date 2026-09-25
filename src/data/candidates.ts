import type { Candidate, CandidateOverride, OpeningId } from '../types/domain'

/**
 * Named candidate records for Senior Product Designer, transcribed from
 * PROTOTYPE_DATA.md sections 11–18. These are the only candidates with
 * detailed evidence in this prototype — the role's 46-candidate total is
 * an aggregate figure and is never used to fabricate additional records.
 */
export const candidates: Candidate[] = [
  {
    id: 'ananya-rao',
    name: 'Ananya Rao',
    openingId: 'senior-product-designer',
    stage: 'HM Review',
    experienceYears: 7,
    location: 'Bengaluru',
    currentRole: 'Senior Product Designer',
    currentCompany: 'Northstar AI',
    recommendation: 'Strong match',
    prioritiesSupported: 4,
    screeningScore: 87,
    evidence: [
      {
        criterionKey: 'enterpriseSaas',
        strength: 'Strong',
        detail:
          'Designed complex B2B SaaS experiences used by enterprise operations teams. Worked on permission-heavy, data-dense workflows.',
      },
      {
        criterionKey: 'complexWorkflows',
        strength: 'Strong',
        detail: 'Led redesigns involving multi-step configuration, approvals and operational workflows.',
      },
      {
        criterionKey: 'aiProductExperience',
        strength: 'Strong',
        detail:
          'Designed AI-assisted workflows for an enterprise intelligence product. Worked on experiences where users review and act on AI-generated recommendations.',
      },
      {
        criterionKey: 'designSystems',
        strength: 'Good',
        detail:
          'Contributed reusable patterns and components to an established enterprise design system. Evidence supports meaningful contribution but not ownership of the entire system.',
      },
      {
        criterionKey: 'leadership',
        strength: 'Unclear',
        detail:
          'Resume references leading initiatives and cross-functional work, but available information does not clearly establish the scale of leadership responsibility or whether she formally led other designers.',
      },
    ],
    summary:
      'Ananya is a strong match. She has supporting evidence across 4 of the 5 configured priorities, with particularly strong evidence in enterprise SaaS, AI product work and complex workflows. Her main uncertainty is leadership ownership, which is not clear enough from the available application information.',
  },
  {
    id: 'rahul-mehta',
    name: 'Rahul Mehta',
    openingId: 'senior-product-designer',
    stage: 'HM Review',
    experienceYears: 8,
    location: 'Bengaluru',
    currentRole: 'Lead Product Designer',
    currentCompany: 'Orbit Systems',
    recommendation: 'Strong match',
    prioritiesSupported: 4,
    screeningScore: 84,
    evidence: [
      {
        criterionKey: 'enterpriseSaas',
        strength: 'Strong',
        detail: 'Designed enterprise workflow products across operations and administration.',
      },
      {
        criterionKey: 'complexWorkflows',
        strength: 'Strong',
        detail: 'Worked extensively on configuration-heavy workflows and permission-based experiences.',
      },
      {
        criterionKey: 'aiProductExperience',
        strength: 'Moderate',
        detail: 'Worked on AI-assisted product features but has less direct AI-product depth than Ananya.',
      },
      {
        criterionKey: 'designSystems',
        strength: 'Strong',
        detail: 'Led design-system adoption across four product teams and contributed to governance.',
      },
      {
        criterionKey: 'leadership',
        strength: 'Good',
        detail: 'Led major initiatives and mentored two designers.',
      },
    ],
    summary:
      'Rahul has particularly strong evidence in design systems, enterprise product design and leadership. Compared with Ananya, Rahul has stronger evidence of design-system ownership and leadership, while Ananya has stronger direct AI-product experience.',
  },
  {
    id: 'meera-shah',
    name: 'Meera Shah',
    openingId: 'senior-product-designer',
    stage: 'HM Review',
    experienceYears: 5,
    location: 'Mumbai',
    currentRole: 'Product Designer II',
    currentCompany: 'Layer',
    recommendation: 'Promising',
    prioritiesSupported: 3,
    screeningScore: 79,
    evidence: [
      {
        criterionKey: 'enterpriseSaas',
        strength: 'Good',
        detail: 'Experience working on B2B workflow products.',
      },
      {
        criterionKey: 'complexWorkflows',
        strength: 'Strong',
        detail: 'Portfolio contains a strong operations workflow case study.',
      },
      {
        criterionKey: 'aiProductExperience',
        strength: 'Good',
        detail: 'Designed an AI-assisted research workflow.',
      },
      {
        criterionKey: 'designSystems',
        strength: 'Moderate',
        detail: 'Used and contributed to an existing system.',
      },
      {
        criterionKey: 'leadership',
        strength: 'Limited',
        detail: 'No strong evidence of senior-level team or initiative leadership yet.',
      },
    ],
    summary: 'Meera has strong product-work evidence but less evidence of senior-level ownership than Ananya or Rahul.',
  },
  {
    id: 'arjun-nair',
    name: 'Arjun Nair',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    experienceYears: 9,
    location: 'Hyderabad',
    recommendation: 'Potential match',
    screeningScore: 76,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Strong', detail: 'Strong evidence of enterprise SaaS experience.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Good evidence of complex workflow design.' },
      { criterionKey: 'aiProductExperience', strength: 'Limited', detail: 'Limited evidence of AI product experience.' },
      { criterionKey: 'designSystems', strength: 'Strong', detail: 'Strong evidence of design-systems work.' },
      { criterionKey: 'leadership', strength: 'Strong', detail: 'Strong evidence of leadership / ownership.' },
    ],
    notableGap: 'Limited evidence of AI product experience.',
  },
  {
    id: 'kavya-iyer',
    name: 'Kavya Iyer',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    experienceYears: 6,
    location: 'Bengaluru',
    recommendation: 'Potential match',
    screeningScore: 75,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Good evidence of enterprise SaaS experience.' },
      { criterionKey: 'complexWorkflows', strength: 'Strong', detail: 'Strong evidence of complex workflow design.' },
      { criterionKey: 'aiProductExperience', strength: 'Strong', detail: 'Strong evidence of AI product experience.' },
      { criterionKey: 'designSystems', strength: 'Limited', detail: 'Limited evidence of design-systems work.' },
      { criterionKey: 'leadership', strength: 'Unclear', detail: 'Not enough information to assess leadership / ownership.' },
    ],
    notableGap: 'Useful alternative when prioritizing AI product experience.',
  },
  {
    id: 'vikram-singh',
    name: 'Vikram Singh',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    experienceYears: 8,
    location: 'Pune',
    recommendation: 'Potential match',
    screeningScore: 73,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Strong', detail: 'Strong evidence of enterprise SaaS experience.' },
      { criterionKey: 'complexWorkflows', strength: 'Strong', detail: 'Strong evidence of complex workflow design.' },
      { criterionKey: 'aiProductExperience', strength: 'Limited', detail: 'Limited evidence of AI product experience.' },
      { criterionKey: 'designSystems', strength: 'Strong', detail: 'Strong evidence of design-systems work.' },
      { criterionKey: 'leadership', strength: 'Good', detail: 'Good evidence of leadership / ownership.' },
    ],
    notableGap: 'Useful alternative when prioritizing design systems or enterprise SaaS.',
  },
  {
    id: 'dev-malhotra',
    name: 'Dev Malhotra',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    experienceYears: 7,
    location: 'Delhi',
    recommendation: 'Potential match',
    screeningScore: 71,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Moderate', detail: 'Moderate evidence of enterprise SaaS experience.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Good evidence of complex workflow design.' },
      { criterionKey: 'aiProductExperience', strength: 'Good', detail: 'Good evidence of AI product experience.' },
      { criterionKey: 'designSystems', strength: 'Moderate', detail: 'Moderate evidence of design-systems work.' },
      { criterionKey: 'leadership', strength: 'Good', detail: 'Good evidence of leadership / ownership.' },
    ],
    notableGap: 'No individual criterion is currently exceptionally strong.',
  },
  {
    id: 'sana-khan',
    name: 'Sana Khan',
    openingId: 'senior-product-designer',
    stage: 'Applied',
    experienceYears: 6,
    location: 'Bengaluru',
    recommendation: 'Needs more information',
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Resume suggests enterprise SaaS experience.' },
      { criterionKey: 'aiProductExperience', strength: 'Possible', detail: 'Resume suggests possible AI product exposure.' },
      { criterionKey: 'complexWorkflows', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'designSystems', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'leadership', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
    ],
    notableGap: 'Not enough information to confidently rank this candidate yet.',
  },

  /**
   * Interview- and Final-stage candidates from PROTOTYPE_DATA.md sections 24 & 26.
   * These exist to make the pipeline believable — the source data intentionally
   * gives them a stage/status/waiting state but no full evidence profile, so we
   * don't fabricate resume details for them.
   */
  {
    id: 'nisha-verma',
    name: 'Nisha Verma',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: "Waiting on Priya's feedback",
    waitingOn: 'priya',
    waitingDays: 5,
  },
  {
    id: 'rohan-das',
    name: 'Rohan Das',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: "Waiting on another interviewer's feedback",
    waitingOn: 'other',
    waitingDays: 4,
  },
  {
    id: 'tara-menon',
    name: 'Tara Menon',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: "Waiting on another interviewer's feedback",
    waitingOn: 'other',
    waitingDays: 4,
  },
  {
    id: 'ishaan-kapoor',
    name: 'Ishaan Kapoor',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: 'Interview scheduled',
  },
  {
    id: 'pooja-reddy',
    name: 'Pooja Reddy',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: 'Interview scheduled',
  },
  {
    id: 'aditya-bose',
    name: 'Aditya Bose',
    openingId: 'senior-product-designer',
    stage: 'Final',
    evidence: [],
    interviewStatus: 'Final evaluation complete',
  },
  {
    id: 'neha-kapoor',
    name: 'Neha Kapoor',
    openingId: 'senior-product-designer',
    stage: 'Final',
    evidence: [],
    interviewStatus: 'Final interview scheduled',
  },
]

export function getCandidatesForOpening(openingId: OpeningId): Candidate[] {
  return candidates.filter((candidate) => candidate.openingId === openingId)
}

export function getCandidate(candidateId: string | undefined): Candidate | undefined {
  return candidates.find((candidate) => candidate.id === candidateId)
}

/** The three candidates surfaced by "Who should I review?" / the Home insight. */
export const recommendedCandidateIds = ['ananya-rao', 'rahul-mehta', 'meera-shah']

/**
 * Merges a stage/hold/reject/etc. override on top of a base candidate record.
 * This is the single point where "current state" is derived — every screen and
 * Copilot both read candidates through this, never the raw static array alone.
 */
export function applyCandidateOverride(candidate: Candidate, override?: CandidateOverride): Candidate {
  if (!override) return candidate
  return {
    ...candidate,
    stage: override.stage ?? candidate.stage,
    hold: override.hold ?? candidate.hold,
    rejected: override.rejected ?? candidate.rejected,
    selected: override.selected ?? candidate.selected,
    interviewStatus: override.interviewStatus ?? candidate.interviewStatus,
    waitingOn: override.waitingOn ?? candidate.waitingOn,
    waitingDays: override.waitingDays ?? candidate.waitingDays,
  }
}
