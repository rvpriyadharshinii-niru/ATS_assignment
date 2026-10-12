import type { Candidate, CandidateOverride, OpeningId } from '../types/domain'

/**
 * Named candidate records for every opening. Senior Product Designer's are transcribed from
 * PROTOTYPE_DATA.md sections 11–18; Product Manager and UX Researcher follow the same shape.
 * Each role's total in openings.ts is an aggregate figure: the rest of it is modelled as
 * pipeline baselines (pipeline.ts) and never used to fabricate additional records.
 */
export const candidates: Candidate[] = [
  {
    id: 'ananya-rao',
    name: 'Ananya Rao',
    openingId: 'senior-product-designer',
    stage: 'HM Review',
    updatedLabel: 'Today',
    source: 'LinkedIn',
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
    updatedLabel: '1d',
    source: 'Referral',
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
    updatedLabel: '2d',
    source: 'Career site',
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
    updatedLabel: '3d',
    source: 'LinkedIn',
    experienceYears: 9,
    location: 'Hyderabad',
    currentRole: 'Principal Product Designer',
    currentCompany: 'Ledgerline',
    recommendation: 'Potential match',
    screeningScore: 76,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Strong', detail: 'Principal designer on a finance operations platform used by enterprise accounting teams.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Redesigned month-end close workflows spanning reconciliation, approvals and audit.' },
      { criterionKey: 'aiProductExperience', strength: 'Limited', detail: 'Only an unshipped anomaly-highlighting prototype; no shipped AI product work is described.' },
      { criterionKey: 'designSystems', strength: 'Strong', detail: 'Owns the Ledgerline design system, including its roadmap and governance.' },
      { criterionKey: 'leadership', strength: 'Strong', detail: 'Leads a team of three system designers and previously led a team of four.' },
    ],
    notableGap: 'Limited evidence of AI product experience.',
  },
  {
    id: 'kavya-iyer',
    name: 'Kavya Iyer',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    updatedLabel: '4d',
    source: 'Career site',
    experienceYears: 6,
    location: 'Bengaluru',
    currentRole: 'Senior Product Designer',
    currentCompany: 'Quanta Health',
    recommendation: 'Potential match',
    screeningScore: 75,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Works on B2B SaaS used by hospital operations teams.' },
      { criterionKey: 'complexWorkflows', strength: 'Strong', detail: 'Owned a prior-authorization workflow across three user roles and eleven approval states.' },
      { criterionKey: 'aiProductExperience', strength: 'Strong', detail: 'Designed AI-generated clinical summaries that users verify and correct before saving.' },
      { criterionKey: 'designSystems', strength: 'Limited', detail: 'Built screens with a shared component library; no contribution to it is described.' },
      { criterionKey: 'leadership', strength: 'Unclear', detail: 'The application does not describe leading people or initiatives.' },
    ],
    notableGap: 'Useful alternative when prioritizing AI product experience.',
  },
  {
    id: 'vikram-singh',
    name: 'Vikram Singh',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    updatedLabel: '4d',
    source: 'Agency',
    experienceYears: 8,
    location: 'Pune',
    currentRole: 'Senior Product Designer',
    currentCompany: 'Fieldwise',
    recommendation: 'Potential match',
    screeningScore: 73,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Strong', detail: 'Designs enterprise field-service SaaS used by operations teams across 40 customer accounts.' },
      { criterionKey: 'complexWorkflows', strength: 'Strong', detail: 'Redesigned dispatch and scheduling workflows with rule-based configuration.' },
      { criterionKey: 'aiProductExperience', strength: 'Limited', detail: 'Contributed research to an internal predictive-scheduling pilot; no shipped AI work is described.' },
      { criterionKey: 'designSystems', strength: 'Strong', detail: 'Co-led the creation of the Fieldwise design system and its token architecture.' },
      { criterionKey: 'leadership', strength: 'Good', detail: 'Led the design workstream for a platform migration with three designers.' },
    ],
    notableGap: 'Useful alternative when prioritizing design systems or enterprise SaaS.',
  },
  {
    id: 'dev-malhotra',
    name: 'Dev Malhotra',
    openingId: 'senior-product-designer',
    stage: 'AI Screened',
    updatedLabel: '5d',
    source: 'LinkedIn',
    experienceYears: 7,
    location: 'Delhi',
    currentRole: 'Product Designer',
    currentCompany: 'Brightpath',
    recommendation: 'Potential match',
    screeningScore: 71,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Moderate', detail: 'Admin workflows for school districts on a B2B education platform — B2B, but not a classic enterprise operations product.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Redesigned the multi-step rostering import flow.' },
      { criterionKey: 'aiProductExperience', strength: 'Good', detail: 'Designed AI-assisted lesson-planning features.' },
      { criterionKey: 'designSystems', strength: 'Moderate', detail: 'Maintained a component library for two product squads.' },
      { criterionKey: 'leadership', strength: 'Good', detail: 'Led the design side of a cross-team initiative to unify reporting.' },
    ],
    notableGap: 'No individual criterion is currently exceptionally strong.',
  },
  {
    id: 'sana-khan',
    name: 'Sana Khan',
    openingId: 'senior-product-designer',
    stage: 'Applied',
    updatedLabel: '6d',
    source: 'Career site',
    experienceYears: 6,
    location: 'Bengaluru',
    currentRole: 'Product Designer',
    currentCompany: 'Cargoline',
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
    experienceYears: 7,
    location: 'Bengaluru',
    currentRole: 'Senior Product Designer',
    currentCompany: 'Paperplane',
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Interview reinforced solid enterprise SaaS depth from earlier rounds.' },
      {
        criterionKey: 'complexWorkflows',
        strength: 'Strong',
        detail: 'Walked through a complex multi-step workflow redesign with clear before/after reasoning.',
      },
      {
        criterionKey: 'aiProductExperience',
        strength: 'Good',
        detail: 'Discussed AI-assisted feature work, though with less depth than the strongest candidates.',
      },
      {
        criterionKey: 'designSystems',
        strength: 'Strong',
        detail: 'Design Lead confirmed strong systems thinking and clear ownership during the interview.',
      },
      {
        criterionKey: 'leadership',
        strength: 'Unclear',
        detail: "Interviewers want to validate ownership at a broader product level before concluding.",
      },
    ],
    interviewStatus: "Waiting on Priya's feedback",
    waitingOn: 'priya',
    waitingDays: 5,
    updatedLabel: '5d',
    source: 'LinkedIn',
  },
  {
    id: 'rohan-das',
    name: 'Rohan Das',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    experienceYears: 9,
    location: 'Chennai',
    currentRole: 'Lead Product Designer',
    currentCompany: 'Helix Cloud',
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Strong', detail: 'Deep enterprise SaaS background, reinforced across both interview rounds.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Solid handling of a configuration-heavy workflow walkthrough.' },
      {
        criterionKey: 'aiProductExperience',
        strength: 'Limited',
        detail: "Hasn't shown much AI-specific product work yet — the panel flagged this as a gap.",
      },
      { criterionKey: 'designSystems', strength: 'Good', detail: 'Solid craft and componentization instincts, without a systems-ownership story.' },
      {
        criterionKey: 'leadership',
        strength: 'Strong',
        detail: 'Confident owner of ambiguous problems with strong stakeholder management.',
      },
    ],
    interviewStatus: "Waiting on another interviewer's feedback",
    waitingOn: 'other',
    waitingDays: 4,
    updatedLabel: '4d',
    source: 'Referral',
  },
  {
    id: 'tara-menon',
    name: 'Tara Menon',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    experienceYears: 6,
    location: 'Kochi',
    currentRole: 'Product Designer',
    currentCompany: 'Northwind Logistics',
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Good evidence of enterprise SaaS experience from the interview.' },
      { criterionKey: 'complexWorkflows', strength: 'Good', detail: 'Good handling of a complex workflow discussion.' },
      { criterionKey: 'aiProductExperience', strength: 'Moderate', detail: 'Some exposure to AI-assisted product work, not yet a clear strength.' },
      { criterionKey: 'designSystems', strength: 'Moderate', detail: 'Used and contributed to an existing design system.' },
      { criterionKey: 'leadership', strength: 'Limited', detail: 'No strong evidence yet of senior-level ownership.' },
    ],
    interviewStatus: "Waiting on another interviewer's feedback",
    waitingOn: 'other',
    waitingDays: 4,
    updatedLabel: '4d',
    source: 'Career site',
  },
  {
    id: 'ishaan-kapoor',
    name: 'Ishaan Kapoor',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    evidence: [],
    interviewStatus: 'Interview scheduled',
    updatedLabel: '2d',
    source: 'Agency',
  },
  {
    id: 'pooja-reddy',
    name: 'Pooja Reddy',
    openingId: 'senior-product-designer',
    stage: 'Interview',
    experienceYears: 7,
    location: 'Hyderabad',
    currentRole: 'Senior Product Designer',
    currentCompany: 'Mosaic Payments',
    recommendation: 'Good match',
    screeningScore: 78,
    evidence: [
      { criterionKey: 'enterpriseSaas', strength: 'Good', detail: 'Designed merchant admin tools for enterprise payment operations teams.' },
      { criterionKey: 'complexWorkflows', strength: 'Strong', detail: 'Owned the dispute-resolution workflow across merchant, bank and internal review roles.' },
      { criterionKey: 'aiProductExperience', strength: 'Unclear', detail: 'The resume does not mention AI-assisted product work.' },
      { criterionKey: 'designSystems', strength: 'Good', detail: 'Contributed form and table patterns to the Mosaic design system.' },
      { criterionKey: 'leadership', strength: 'Moderate', detail: 'Led a two-designer squad for the merchant onboarding revamp.' },
    ],
    interviewStatus: 'Interview scheduled',
    updatedLabel: '2d',
    source: 'LinkedIn',
  },
  {
    id: 'aditya-bose',
    name: 'Aditya Bose',
    openingId: 'senior-product-designer',
    stage: 'Final',
    evidence: [],
    interviewStatus: 'Final evaluation complete',
    updatedLabel: '6d',
    source: 'Referral',
  },
  {
    id: 'neha-kapoor',
    name: 'Neha Kapoor',
    openingId: 'senior-product-designer',
    stage: 'Final',
    evidence: [],
    interviewStatus: 'Final interview scheduled',
    updatedLabel: '3d',
    source: 'Career site',
  },

  /**
   * Product Manager. Aarav Sethi is the finalist from PROTOTYPE_DATA.md section 27, now with a full
   * evidence profile; the others are this opening's named applicants and its one upcoming interview.
   * Every evidence detail restates a passage in sources.ts.
   */
  {
    id: 'aarav-sethi',
    name: 'Aarav Sethi',
    openingId: 'product-manager',
    stage: 'Final',
    experienceYears: 8,
    location: 'Mumbai',
    currentRole: 'Senior Product Manager',
    currentCompany: 'Tidepool',
    recommendation: 'Strong match',
    prioritiesSupported: 5,
    screeningScore: 88,
    evidence: [
      {
        criterionKey: 'productStrategy',
        strength: 'Strong',
        detail: 'Owned the Tidepool procurement roadmap and reprioritised it around three enterprise customer outcomes, retiring 40% of the backlog.',
      },
      {
        criterionKey: 'customerDiscovery',
        strength: 'Good',
        detail: 'Runs a continuous discovery programme of roughly 25 customer interviews a quarter with finance and procurement leads.',
      },
      {
        criterionKey: 'dataInformedDecisions',
        strength: 'Strong',
        detail: 'Set up the product activation metrics framework and ran 14 onboarding and pricing experiments.',
      },
      {
        criterionKey: 'b2bSaasDomain',
        strength: 'Strong',
        detail: '8 years in B2B SaaS, most recently procurement and spend-management products for enterprise finance teams.',
      },
      {
        criterionKey: 'crossFunctionalCollaboration',
        strength: 'Good',
        detail: 'Led a squad of eight engineers and two designers through the approval-workflow rebuild; the Engineering Manager called him a strong partner to engineering.',
      },
    ],
    summary:
      'Aarav is a strong match. He has supporting evidence across all 5 configured priorities, strongest in product strategy, data-informed decisions and B2B SaaS. The open question from the final round is the depth of his qualitative discovery.',
    interviewStatus: 'Awaiting Hiring Manager decision',
    updatedLabel: '1d',
    source: 'Referral',
  },
  {
    id: 'riya-desai',
    name: 'Riya Desai',
    openingId: 'product-manager',
    stage: 'HM Review',
    updatedLabel: 'Today',
    source: 'LinkedIn',
    experienceYears: 7,
    location: 'Bengaluru',
    currentRole: 'Senior Product Manager',
    currentCompany: 'Clearbook',
    recommendation: 'Strong match',
    prioritiesSupported: 4,
    screeningScore: 86,
    evidence: [
      {
        criterionKey: 'productStrategy',
        strength: 'Strong',
        detail: 'Owns strategy for Clearbook’s close-management product: sets the annual roadmap and the prioritisation framework three squads use.',
      },
      {
        criterionKey: 'customerDiscovery',
        strength: 'Strong',
        detail: 'Interviews 8–10 controllers a month; turned discovery findings into the reconciliation assistant, now used by 70% of accounts.',
      },
      {
        criterionKey: 'dataInformedDecisions',
        strength: 'Good',
        detail: 'Defined the north-star metric and dashboards for the close product and uses cohort analysis to decide what to build next.',
      },
      {
        criterionKey: 'b2bSaasDomain',
        strength: 'Strong',
        detail: '7 years building B2B SaaS for finance and operations teams.',
      },
      {
        criterionKey: 'crossFunctionalCollaboration',
        strength: 'Moderate',
        detail: 'Partners with engineering, design and sales leads in a weekly product council; what she drove there is not described.',
      },
    ],
    summary:
      'Riya is a strong match. She has supporting evidence across 4 of the 5 configured priorities, with particularly strong evidence in product strategy, customer discovery and B2B SaaS. Cross-functional leadership is the least demonstrated.',
  },
  {
    id: 'karan-joshi',
    name: 'Karan Joshi',
    openingId: 'product-manager',
    stage: 'HM Review',
    updatedLabel: '1d',
    source: 'Referral',
    experienceYears: 6,
    location: 'Pune',
    currentRole: 'Product Manager',
    currentCompany: 'Stackwise',
    recommendation: 'Good match',
    prioritiesSupported: 3,
    screeningScore: 81,
    evidence: [
      {
        criterionKey: 'productStrategy',
        strength: 'Moderate',
        detail: 'Re-sequenced the quarterly roadmap after an outage review, moving reliability work ahead of new features.',
      },
      {
        criterionKey: 'customerDiscovery',
        strength: 'Limited',
        detail: 'Ran usability sessions with internal operations users; no external customer discovery is described.',
      },
      {
        criterionKey: 'dataInformedDecisions',
        strength: 'Strong',
        detail: 'Introduced experiment reviews and an event-tracking plan, so decisions on the pipeline UI are backed by usage data.',
      },
      {
        criterionKey: 'b2bSaasDomain',
        strength: 'Strong',
        detail: 'Product manager for a deployment platform sold to engineering teams at mid-size and enterprise companies.',
      },
      {
        criterionKey: 'crossFunctionalCollaboration',
        strength: 'Strong',
        detail: 'Coordinated a release across four engineering teams, support and sales enablement.',
      },
    ],
    summary:
      'Karan has strong evidence in data-informed decisions, B2B SaaS and cross-functional delivery. Compared with Riya, he has less evidence of setting product direction and of external customer discovery.',
  },
  {
    id: 'divya-pillai',
    name: 'Divya Pillai',
    openingId: 'product-manager',
    stage: 'AI Screened',
    updatedLabel: '3d',
    source: 'Career site',
    experienceYears: 4,
    location: 'Chennai',
    currentRole: 'Product Manager',
    currentCompany: 'Mintleaf',
    recommendation: 'Promising',
    screeningScore: 74,
    evidence: [
      { criterionKey: 'productStrategy', strength: 'Good', detail: 'Proposed and won approval for a shift from feature launches to retention, and owns the H2 roadmap.' },
      { criterionKey: 'customerDiscovery', strength: 'Strong', detail: 'Runs weekly user interviews and diary studies on how young professionals plan their savings.' },
      { criterionKey: 'dataInformedDecisions', strength: 'Strong', detail: 'Ran 30+ A/B tests on onboarding and goal-setting for a consumer savings app.' },
      { criterionKey: 'b2bSaasDomain', strength: 'Limited', detail: 'Both roles are consumer products (savings and food delivery); no B2B SaaS work is described.' },
      { criterionKey: 'crossFunctionalCollaboration', strength: 'Moderate', detail: 'Works day to day with a squad of five engineers and one designer.' },
    ],
    notableGap: 'No B2B SaaS experience described yet.',
  },
  {
    id: 'farhan-qureshi',
    name: 'Farhan Qureshi',
    openingId: 'product-manager',
    stage: 'Applied',
    updatedLabel: '2d',
    source: 'LinkedIn',
    experienceYears: 5,
    location: 'Hyderabad',
    currentRole: 'Product Manager',
    currentCompany: 'Haulmark',
    recommendation: 'Needs more information',
    evidence: [
      { criterionKey: 'b2bSaasDomain', strength: 'Good', detail: 'Application says he is a product manager on a B2B logistics platform.' },
      { criterionKey: 'dataInformedDecisions', strength: 'Possible', detail: 'Application mentions working with data teams on reporting features.' },
      { criterionKey: 'productStrategy', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'customerDiscovery', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'crossFunctionalCollaboration', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
    ],
    notableGap: 'Not enough information to confidently rank this candidate yet.',
  },
  {
    id: 'siddharth-kulkarni',
    name: 'Siddharth Kulkarni',
    openingId: 'product-manager',
    stage: 'Interview',
    experienceYears: 9,
    location: 'Bengaluru',
    currentRole: 'Group Product Manager',
    currentCompany: 'Pinecrest Cloud',
    recommendation: 'Good match',
    screeningScore: 80,
    evidence: [
      { criterionKey: 'productStrategy', strength: 'Strong', detail: 'Set a two-year platform strategy that consolidated three products into one suite.' },
      { criterionKey: 'customerDiscovery', strength: 'Moderate', detail: 'Ran customer advisory boards with enterprise HR leaders; hands-on discovery interviews are not described.' },
      { criterionKey: 'dataInformedDecisions', strength: 'Good', detail: 'Introduced quarterly business reviews built on adoption and retention metrics.' },
      { criterionKey: 'b2bSaasDomain', strength: 'Strong', detail: 'Group product manager for an HR and payroll suite sold to enterprise HR teams.' },
      { criterionKey: 'crossFunctionalCollaboration', strength: 'Strong', detail: 'Leads four product managers and partners with engineering, design and customer success directors.' },
    ],
    interviewStatus: 'Interview scheduled',
    updatedLabel: '1d',
    source: 'Agency',
  },

  /**
   * UX Researcher. Screening is still in progress, so everyone named here is AI Screened or in
   * HM Review and nothing is waiting on Priya.
   */
  {
    id: 'zoya-mirza',
    name: 'Zoya Mirza',
    openingId: 'ux-researcher',
    stage: 'HM Review',
    updatedLabel: '2d',
    source: 'LinkedIn',
    experienceYears: 6,
    location: 'Bengaluru',
    currentRole: 'Senior UX Researcher',
    currentCompany: 'Fernhill',
    recommendation: 'Strong match',
    prioritiesSupported: 4,
    screeningScore: 85,
    evidence: [
      {
        criterionKey: 'researchMethods',
        strength: 'Strong',
        detail: 'Runs mixed-methods research for an HR suite: contextual inquiry, usability testing, surveys and unmoderated card sorts.',
      },
      {
        criterionKey: 'researchSynthesis',
        strength: 'Strong',
        detail: 'Synthesised 40 interviews into a jobs-to-be-done framework that now structures the product roadmap.',
      },
      {
        criterionKey: 'researchImpact',
        strength: 'Strong',
        detail: 'Research on manager approvals led the team to drop a planned feature and redesign the approvals queue instead.',
      },
      {
        criterionKey: 'enterpriseResearchContext',
        strength: 'Good',
        detail: 'Recruits and interviews HR administrators at enterprise customers with 5,000+ employees.',
      },
      {
        criterionKey: 'communicationSkills',
        strength: 'Unclear',
        detail: 'The resume does not describe how she shares findings with stakeholders.',
      },
    ],
    summary:
      'Zoya is a strong match. She has supporting evidence across 4 of the 5 configured priorities, with particularly strong evidence in research methods, synthesis and research impact. How she communicates findings is not described.',
  },
  {
    id: 'manav-chawla',
    name: 'Manav Chawla',
    openingId: 'ux-researcher',
    stage: 'AI Screened',
    updatedLabel: '1d',
    source: 'Career site',
    experienceYears: 5,
    location: 'Gurugram',
    currentRole: 'UX Researcher',
    currentCompany: 'Quillstack',
    recommendation: 'Good match',
    screeningScore: 78,
    evidence: [
      { criterionKey: 'researchMethods', strength: 'Moderate', detail: 'Leads usability testing and interview studies; no other methods are described.' },
      { criterionKey: 'researchSynthesis', strength: 'Good', detail: 'Maintains the team’s research repository and tags insights across studies.' },
      { criterionKey: 'researchImpact', strength: 'Good', detail: 'Research with legal operations teams shaped the approval-routing feature.' },
      { criterionKey: 'enterpriseResearchContext', strength: 'Strong', detail: 'Researches with legal operations teams at enterprise customers of a B2B document workflow product.' },
      { criterionKey: 'communicationSkills', strength: 'Strong', detail: 'Presents a monthly research readout to product, design and sales leadership.' },
    ],
    notableGap: 'Narrower range of research methods than the strongest applicant.',
  },
  {
    id: 'lakshmi-krishnan',
    name: 'Lakshmi Krishnan',
    openingId: 'ux-researcher',
    stage: 'AI Screened',
    updatedLabel: '2d',
    source: 'Referral',
    experienceYears: 3,
    location: 'Hyderabad',
    currentRole: 'Design Researcher',
    currentCompany: 'Pocketful',
    recommendation: 'Promising',
    screeningScore: 72,
    evidence: [
      { criterionKey: 'researchMethods', strength: 'Good', detail: 'Plans and runs diary studies, interviews and concept tests for a budgeting app.' },
      { criterionKey: 'researchSynthesis', strength: 'Strong', detail: 'Built an affinity-mapping synthesis workshop that the design team now runs after every study.' },
      { criterionKey: 'researchImpact', strength: 'Limited', detail: 'Findings were shared with the product team ahead of quarterly planning; no decision is described as changing.' },
      { criterionKey: 'enterpriseResearchContext', strength: 'Not available', detail: 'All described research is on a consumer app.' },
      { criterionKey: 'communicationSkills', strength: 'Good', detail: 'Writes study reports and short video highlight reels for each release.' },
    ],
    notableGap: 'No enterprise or B2B research context yet.',
  },
  {
    id: 'aditi-banerjee',
    name: 'Aditi Banerjee',
    openingId: 'ux-researcher',
    stage: 'AI Screened',
    updatedLabel: '1d',
    source: 'Career site',
    experienceYears: 4,
    location: 'Kolkata',
    currentRole: 'UX Researcher',
    currentCompany: 'Northbeam Analytics',
    recommendation: 'Needs more information',
    evidence: [
      { criterionKey: 'enterpriseResearchContext', strength: 'Good', detail: 'Application says she is a UX researcher on a B2B analytics product.' },
      { criterionKey: 'researchMethods', strength: 'Possible', detail: 'Application mentions user interviews and usability tests.' },
      { criterionKey: 'researchSynthesis', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'researchImpact', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
      { criterionKey: 'communicationSkills', strength: 'Not available', detail: 'Insufficient information to assess this criterion yet.' },
    ],
    notableGap: 'Not enough information to confidently rank this candidate yet.',
  },
]

export function getCandidatesForOpening(openingId: OpeningId): Candidate[] {
  return candidates.filter((candidate) => candidate.openingId === openingId)
}

export function getCandidate(candidateId: string | undefined): Candidate | undefined {
  return candidates.find((candidate) => candidate.id === candidateId)
}

/**
 * Appends a candidate entered through Add Candidate or CSV Import to the live pool, in place —
 * every reader above (getCandidate, getCandidatesForOpening, the `candidates` array itself) picks
 * it up on its next call with no separate cache, exactly like the static seed records.
 */
export function addManualCandidate(candidate: Candidate): void {
  candidates.push(candidate)
}

/** The prototype's original named record count — every candidate added after this point (Add Candidate, CSV Import) is demo-session-only. */
const SEED_CANDIDATE_COUNT = candidates.length

/** Drops every candidate added during this session, restoring the original named records — used by Settings' "Reset demo data". */
export function resetCandidatesToSeed(): void {
  candidates.length = SEED_CANDIDATE_COUNT
}

export function slugifyCandidateId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  let id = base || 'candidate'
  let suffix = 1
  while (getCandidate(id)) {
    suffix += 1
    id = `${base}-${suffix}`
  }
  return id
}

const RECOMMENDATION_RANK: Record<string, number> = { 'Strong match': 2, 'Good match': 1 }

/**
 * Review-first picks for the openings without a curated list: reviewable-stage candidates with a
 * Strong or Good match, strongest recommendation first, then by screening score.
 */
function strengthOrderedRecommendations(openingId: OpeningId): string[] {
  return candidates
    .filter((candidate) => candidate.openingId === openingId && ['Applied', 'AI Screened', 'HM Review'].includes(candidate.stage))
    .filter((candidate) => RECOMMENDATION_RANK[candidate.recommendation ?? ''] !== undefined)
    .sort((a, b) => RECOMMENDATION_RANK[b.recommendation!] - RECOMMENDATION_RANK[a.recommendation!] || (b.screeningScore ?? 0) - (a.screeningScore ?? 0))
    .map((candidate) => candidate.id)
}

/**
 * Who to review first, per opening, in order. Senior Product Designer's three are curated
 * (PROTOTYPE_DATA.md, "Who should I review?" / the Home insight); the other openings are ordered
 * by evidence strength. Every reader filters this list against one opening's pool, so the
 * flat, ordered array works for all of them.
 */
export const recommendedCandidateIds = [
  'ananya-rao',
  'rahul-mehta',
  'meera-shah',
  ...strengthOrderedRecommendations('product-manager'),
  ...strengthOrderedRecommendations('ux-researcher'),
]

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
    // These three track a specific in-stage wait, which a stage change always invalidates — so an
    // override that explicitly sets the key (even to undefined, to clear it) wins over the base value.
    interviewStatus: 'interviewStatus' in override ? override.interviewStatus : candidate.interviewStatus,
    waitingOn: 'waitingOn' in override ? override.waitingOn : candidate.waitingOn,
    waitingDays: 'waitingDays' in override ? override.waitingDays : candidate.waitingDays,
  }
}
