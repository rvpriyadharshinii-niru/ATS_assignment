import type { CriterionKey } from '../types/domain'

/**
 * HireFlow V2 source documents — the fictional resumes, portfolio notes and interviewer
 * scorecards that every AI claim in the workspace is derived from. The rule this file exists
 * to enforce: a claim may only cite a passage that is written here. When a criterion has no
 * supporting passage, its entry in EVIDENCE_SOURCES is empty and the UI says so instead of
 * inventing a citation.
 */

export interface Passage {
  id: string
  text: string
}

export interface ResumeRole {
  company: string
  role: string
  dateRange: string
  location?: string
  points: Passage[]
}

export interface ResumeRecord {
  candidateId: string
  fileName: string
  receivedLabel: string
  summary?: Passage
  roles: ResumeRole[]
  portfolio?: { title: string; points: Passage[] }
  skills: string[]
  education?: { degree: string; school: string; dateRange: string }
}

export interface FeedbackRecord {
  id: string
  candidateId: string
  reviewer: string
  round: string
  submittedLabel: string
  overall: 'Lean hire' | 'Hire' | 'Mixed' | 'No decision'
  points: Passage[]
}

export interface SourceBlock {
  heading?: string
  meta?: string
  passages: Passage[]
}

export interface SourceDocument {
  id: string
  candidateId: string
  kind: 'resume' | 'feedback'
  title: string
  subtitle: string
  blocks: SourceBlock[]
}

export interface EvidenceSource {
  passageIds: string[]
  /** Shown when the evidence is partial or absent — what the documents do and don't say. */
  note?: string
  /** Two sources that point in different directions. Both stay visible; the AI never silently picks one. */
  conflict?: { passageIds: string[]; note: string }
}

const RESUMES: ResumeRecord[] = [
  {
    candidateId: 'ananya-rao',
    fileName: 'Ananya_Rao_Resume.pdf',
    receivedLabel: 'Received via LinkedIn · 12 days ago',
    summary: {
      id: 'ananya.sum',
      text: 'Senior product designer with 7 years designing B2B SaaS for enterprise operations teams. Currently focused on AI-assisted workflows where people review and act on machine-generated recommendations.',
    },
    roles: [
      {
        company: 'Northstar AI',
        role: 'Senior Product Designer',
        dateRange: '2022 – Present',
        location: 'Bengaluru',
        points: [
          {
            id: 'ananya.n1',
            text: 'Lead designer for Signal, an enterprise intelligence product. Designed the review queue where analysts accept, edit or dismiss AI-generated recommendations.',
          },
          {
            id: 'ananya.n2',
            text: 'Redesigned the multi-step workspace configuration flow (roles, permissions and approval chains) used by more than 300 enterprise admin teams.',
          },
          {
            id: 'ananya.n3',
            text: 'Led a cross-functional initiative with product, data science and engineering to add confidence indicators to AI outputs.',
          },
          { id: 'ananya.n4', text: 'Contributed 14 reusable components and interaction patterns to Atlas, Northstar’s shared design system.' },
        ],
      },
      {
        company: 'Corvus Cloud',
        role: 'Product Designer',
        dateRange: '2018 – 2022',
        location: 'Bengaluru',
        points: [
          { id: 'ananya.c1', text: 'Designed permission-heavy, data-dense admin consoles for enterprise operations teams.' },
          { id: 'ananya.c2', text: 'Owned the approvals and exception-handling workflow for the operations module, from research through launch.' },
          { id: 'ananya.c3', text: 'Partnered with two engineering squads on quarterly releases.' },
        ],
      },
    ],
    skills: ['Enterprise SaaS', 'AI-assisted workflows', 'Complex workflows', 'Design systems', 'Prototyping', 'User research'],
    education: { degree: 'Bachelor of Design', school: 'National Institute of Design', dateRange: '2014 – 2018' },
  },
  {
    candidateId: 'rahul-mehta',
    fileName: 'Rahul_Mehta_Resume.pdf',
    receivedLabel: 'Referral · 13 days ago',
    summary: { id: 'rahul.sum', text: 'Lead product designer with 8 years in enterprise workflow software for operations and administration teams.' },
    roles: [
      {
        company: 'Orbit Systems',
        role: 'Lead Product Designer',
        dateRange: '2021 – Present',
        location: 'Bengaluru',
        points: [
          { id: 'rahul.o1', text: 'Lead designer for the Orbit operations suite; designed configuration-heavy workflows for scheduling, routing and role-based permissions.' },
          { id: 'rahul.o2', text: 'Led adoption of the Orbit design system across four product teams and set up its contribution and governance process.' },
          { id: 'rahul.o3', text: 'Mentored two product designers through their first year on the team.' },
          { id: 'rahul.o4', text: 'Designed the interaction model for an AI-assisted ticket triage feature: suggested categories with a manual override.' },
        ],
      },
      {
        company: 'Kite Labs',
        role: 'Senior Product Designer',
        dateRange: '2016 – 2021',
        location: 'Pune',
        points: [
          { id: 'rahul.k1', text: 'Designed administration consoles for enterprise customers, including audit logs and bulk user management.' },
          { id: 'rahul.k2', text: 'Led the redesign of the permissions model across the admin product, from research through launch.' },
        ],
      },
    ],
    skills: ['Enterprise workflows', 'Design systems', 'Governance', 'Mentoring', 'Interaction design'],
    education: { degree: 'Bachelor of Fine Arts', school: 'Srishti Institute of Art, Design and Technology', dateRange: '2012 – 2016' },
  },
  {
    candidateId: 'meera-shah',
    fileName: 'Meera_Shah_Resume.pdf',
    receivedLabel: 'Career site · 11 days ago',
    summary: { id: 'meera.sum', text: 'Product designer with 5 years in B2B workflow tools, focused on research-heavy and operational products.' },
    roles: [
      {
        company: 'Layer',
        role: 'Product Designer II',
        dateRange: '2022 – Present',
        location: 'Mumbai',
        points: [
          { id: 'meera.l1', text: 'Designed an AI-assisted research synthesis workflow that clusters interview notes and lets researchers edit the suggested themes.' },
          { id: 'meera.l2', text: 'Shipped a B2B workflow product for operations teams at mid-sized companies.' },
          { id: 'meera.l3', text: 'Contributed components and documentation to Layer’s existing design system.' },
        ],
      },
      {
        company: 'Brightside',
        role: 'Product Designer',
        dateRange: '2020 – 2022',
        location: 'Mumbai',
        points: [{ id: 'meera.b1', text: 'Designed onboarding and settings flows for a B2B scheduling tool.' }],
      },
    ],
    portfolio: {
      title: 'Portfolio case study',
      points: [{ id: 'meera.p1', text: 'Rebuilding warehouse exception handling: an operations workflow reduced from seven steps to four, validated with floor supervisors.' }],
    },
    skills: ['B2B workflows', 'Research synthesis', 'AI-assisted tools', 'Prototyping'],
    education: { degree: 'Bachelor of Design', school: 'MIT Institute of Design', dateRange: '2016 – 2020' },
  },
  {
    candidateId: 'arjun-nair',
    fileName: 'Arjun_Nair_Resume.pdf',
    receivedLabel: 'LinkedIn · 9 days ago',
    roles: [
      {
        company: 'Ledgerline',
        role: 'Principal Product Designer',
        dateRange: '2020 – Present',
        location: 'Hyderabad',
        points: [
          { id: 'arjun.l1', text: 'Principal designer for Ledgerline’s finance operations platform, used by enterprise accounting teams.' },
          { id: 'arjun.l2', text: 'Own the Ledgerline design system: roadmap, governance and a team of three system designers.' },
          { id: 'arjun.l3', text: 'Redesigned month-end close workflows spanning reconciliation, approvals and audit.' },
          { id: 'arjun.l4', text: 'Explored an anomaly-highlighting prototype with the data team (not shipped).' },
        ],
      },
      {
        company: 'Tessellate',
        role: 'Senior Product Designer',
        dateRange: '2015 – 2020',
        location: 'Hyderabad',
        points: [{ id: 'arjun.t1', text: 'Led a design team of four for the enterprise admin product.' }],
      },
    ],
    skills: ['Design systems', 'Enterprise SaaS', 'Team leadership', 'Financial workflows'],
    education: { degree: 'Bachelor of Technology', school: 'IIT Bombay', dateRange: '2011 – 2015' },
  },
  {
    candidateId: 'kavya-iyer',
    fileName: 'Kavya_Iyer_Resume.pdf',
    receivedLabel: 'Career site · 8 days ago',
    roles: [
      {
        company: 'Quanta Health',
        role: 'Senior Product Designer',
        dateRange: '2021 – Present',
        location: 'Bengaluru',
        points: [
          { id: 'kavya.q1', text: 'Designed AI-generated clinical summaries that clinicians verify and correct before saving to the record.' },
          { id: 'kavya.q2', text: 'Owned the prior-authorization workflow across three user roles and eleven approval states.' },
          { id: 'kavya.q3', text: 'Worked on B2B SaaS used by hospital operations teams.' },
          { id: 'kavya.q4', text: 'Built screens using the shared component library.' },
        ],
      },
      {
        company: 'Medly',
        role: 'Product Designer',
        dateRange: '2019 – 2021',
        location: 'Bengaluru',
        points: [{ id: 'kavya.m1', text: 'Designed appointment and billing flows for clinic staff.' }],
      },
    ],
    skills: ['AI-assisted workflows', 'Healthcare SaaS', 'Complex workflows', 'Usability testing'],
    education: { degree: 'Bachelor of Design', school: 'National Institute of Design', dateRange: '2015 – 2019' },
  },
  {
    candidateId: 'vikram-singh',
    fileName: 'Vikram_Singh_Resume.pdf',
    receivedLabel: 'Agency · 8 days ago',
    roles: [
      {
        company: 'Fieldwise',
        role: 'Senior Product Designer',
        dateRange: '2019 – Present',
        location: 'Pune',
        points: [
          { id: 'vikram.f1', text: 'Designed enterprise field-service SaaS used by operations teams across 40 customer accounts.' },
          { id: 'vikram.f2', text: 'Redesigned dispatch and scheduling workflows with rule-based configuration.' },
          { id: 'vikram.f3', text: 'Co-led the creation of the Fieldwise design system and its token architecture.' },
          { id: 'vikram.f4', text: 'Led the design workstream for a platform migration with three designers.' },
          { id: 'vikram.f5', text: 'Contributed research to an internal pilot of predictive scheduling.' },
        ],
      },
      {
        company: 'Routeline',
        role: 'Product Designer',
        dateRange: '2016 – 2019',
        location: 'Pune',
        points: [{ id: 'vikram.r1', text: 'Designed fleet tracking dashboards for logistics managers.' }],
      },
    ],
    skills: ['Enterprise SaaS', 'Design systems', 'Scheduling workflows', 'Design tokens'],
    education: { degree: 'Bachelor of Design', school: 'Symbiosis Institute of Design', dateRange: '2012 – 2016' },
  },
  {
    candidateId: 'dev-malhotra',
    fileName: 'Dev_Malhotra_Resume.pdf',
    receivedLabel: 'LinkedIn · 7 days ago',
    roles: [
      {
        company: 'Brightpath',
        role: 'Product Designer',
        dateRange: '2020 – Present',
        location: 'Delhi',
        points: [
          { id: 'dev.b1', text: 'Designed AI-assisted lesson-planning features for a B2B education platform.' },
          { id: 'dev.b2', text: 'Worked on admin workflows for school districts, including rostering and permissions.' },
          { id: 'dev.b3', text: 'Redesigned the multi-step rostering import flow, reducing related support tickets.' },
          { id: 'dev.b4', text: 'Maintained a component library for two product squads.' },
          { id: 'dev.b5', text: 'Led the design side of a cross-team initiative to unify reporting.' },
        ],
      },
      {
        company: 'Pixelcraft Studio',
        role: 'UX Designer',
        dateRange: '2017 – 2020',
        location: 'Delhi',
        points: [{ id: 'dev.p1', text: 'Designed web and mobile experiences for agency clients in retail and education.' }],
      },
    ],
    skills: ['EdTech', 'AI-assisted features', 'Admin workflows', 'Component libraries'],
    education: { degree: 'Bachelor of Fine Arts', school: 'College of Art, Delhi', dateRange: '2013 – 2017' },
  },
  {
    candidateId: 'sana-khan',
    fileName: 'Sana_Khan_Application.pdf',
    receivedLabel: 'Career site · 6 days ago · short-form application',
    roles: [
      {
        company: 'Cargoline',
        role: 'Product Designer',
        dateRange: '2019 – Present',
        location: 'Bengaluru',
        points: [
          { id: 'sana.c1', text: 'Product designer working on enterprise SaaS dashboards for a logistics company.' },
          { id: 'sana.c2', text: 'Exposure to machine-learning driven features.' },
        ],
      },
    ],
    skills: ['Dashboards', 'Logistics SaaS'],
  },
  {
    candidateId: 'nisha-verma',
    fileName: 'Nisha_Verma_Resume.pdf',
    receivedLabel: 'LinkedIn · 24 days ago',
    roles: [
      {
        company: 'Paperplane',
        role: 'Senior Product Designer',
        dateRange: '2021 – Present',
        location: 'Bengaluru',
        points: [
          { id: 'nisha.p1', text: 'Designed procurement and invoicing workflows for enterprise finance teams.' },
          { id: 'nisha.p2', text: 'Maintains the Paperplane component library and its contribution guidelines.' },
        ],
      },
      {
        company: 'Zeta Grid',
        role: 'Product Designer',
        dateRange: '2017 – 2021',
        location: 'Bengaluru',
        points: [{ id: 'nisha.z1', text: 'Designed AI-assisted invoice matching suggestions with an accept/reject flow.' }],
      },
    ],
    skills: ['Enterprise finance', 'Design systems', 'Workflow design'],
    education: { degree: 'Bachelor of Design', school: 'National Institute of Design', dateRange: '2013 – 2017' },
  },
  {
    candidateId: 'rohan-das',
    fileName: 'Rohan_Das_Resume.pdf',
    receivedLabel: 'Referral · 26 days ago',
    roles: [
      {
        company: 'Helix Cloud',
        role: 'Lead Product Designer',
        dateRange: '2019 – Present',
        location: 'Chennai',
        points: [
          { id: 'rohan.h1', text: 'Lead designer for the Helix admin console used by enterprise IT teams.' },
          { id: 'rohan.h2', text: 'Designed AI-assisted search suggestions for the Helix admin console.' },
          { id: 'rohan.h3', text: 'Drove alignment across product, sales and support on an ambiguous platform re-architecture.' },
        ],
      },
    ],
    skills: ['Enterprise SaaS', 'Stakeholder management', 'Admin consoles'],
    education: { degree: 'Bachelor of Technology', school: 'Anna University', dateRange: '2011 – 2015' },
  },
  {
    candidateId: 'tara-menon',
    fileName: 'Tara_Menon_Resume.pdf',
    receivedLabel: 'Career site · 20 days ago',
    roles: [
      {
        company: 'Northwind Logistics',
        role: 'Product Designer',
        dateRange: '2020 – Present',
        location: 'Kochi',
        points: [
          { id: 'tara.n1', text: 'Designed shipment exception workflows for enterprise logistics customers.' },
          { id: 'tara.n2', text: 'Uses and contributes to the Northwind design system.' },
        ],
      },
    ],
    skills: ['Logistics SaaS', 'Workflow design'],
  },
  {
    candidateId: 'pooja-reddy',
    fileName: 'Pooja_Reddy_Resume.pdf',
    receivedLabel: 'LinkedIn · 22 days ago',
    summary: { id: 'pooja.sum', text: 'Senior product designer with 7 years in payments and financial operations software.' },
    roles: [
      {
        company: 'Mosaic Payments',
        role: 'Senior Product Designer',
        dateRange: '2021 – Present',
        location: 'Hyderabad',
        points: [
          { id: 'pooja.m1', text: 'Designed merchant admin tools for enterprise payment operations teams.' },
          { id: 'pooja.m2', text: 'Owned the dispute-resolution workflow across merchant, bank and internal review roles.' },
          { id: 'pooja.m3', text: 'Contributed form and table patterns to the Mosaic design system.' },
          { id: 'pooja.m4', text: 'Led a two-designer squad for the merchant onboarding revamp.' },
        ],
      },
      {
        company: 'Finch',
        role: 'Product Designer',
        dateRange: '2017 – 2021',
        location: 'Hyderabad',
        points: [{ id: 'pooja.f1', text: 'Designed expense approval flows for small-business finance teams.' }],
      },
    ],
    skills: ['Payments', 'Complex workflows', 'Design systems'],
    education: { degree: 'Bachelor of Design', school: 'IIT Hyderabad', dateRange: '2013 – 2017' },
  },
]

const FEEDBACK: FeedbackRecord[] = [
  {
    id: 'fb-nisha-design',
    candidateId: 'nisha-verma',
    reviewer: 'Design Lead',
    round: 'Round 2 · Design interview',
    submittedLabel: 'Submitted 5 days ago',
    overall: 'Hire',
    points: [
      { id: 'nisha.fd1', text: 'Strong systems thinking and clear rationale.' },
      { id: 'nisha.fd2', text: 'Walked through a complex multi-step workflow redesign with clear before/after reasoning.' },
      { id: 'nisha.fd3', text: 'Clear ownership of the component decisions she described.' },
    ],
  },
  {
    id: 'fb-nisha-product',
    candidateId: 'nisha-verma',
    reviewer: 'Product Lead',
    round: 'Round 2 · Product interview',
    submittedLabel: 'Submitted 5 days ago',
    overall: 'Mixed',
    points: [
      { id: 'nisha.fp1', text: 'Strong execution. Would validate ownership at a broader product level.' },
      { id: 'nisha.fp2', text: 'Solid enterprise SaaS depth, consistent with earlier rounds.' },
      { id: 'nisha.fp3', text: 'Discussed AI-assisted feature work, with less depth than the strongest candidates.' },
    ],
  },
  {
    id: 'fb-rohan-product',
    candidateId: 'rohan-das',
    reviewer: 'Product Lead',
    round: 'Round 1 · Product interview',
    submittedLabel: 'Submitted 9 days ago',
    overall: 'Hire',
    points: [
      { id: 'rohan.fp1', text: 'Confident owner of ambiguous problems, strong stakeholder management.' },
      { id: 'rohan.fp2', text: 'Deep enterprise SaaS background.' },
    ],
  },
  {
    id: 'fb-rohan-design',
    candidateId: 'rohan-das',
    reviewer: 'Design Lead',
    round: 'Round 1 · Portfolio review',
    submittedLabel: 'Submitted 9 days ago',
    overall: 'Mixed',
    points: [
      { id: 'rohan.fd1', text: 'Solid craft. Hasn’t shown much AI-specific product work yet.' },
      { id: 'rohan.fd2', text: 'Solid handling of a configuration-heavy workflow walkthrough.' },
    ],
  },
  {
    id: 'fb-tara-product',
    candidateId: 'tara-menon',
    reviewer: 'Product Lead',
    round: 'Round 1 · Product interview',
    submittedLabel: 'Submitted 4 days ago',
    overall: 'Mixed',
    points: [
      { id: 'tara.fp1', text: 'Good depth on enterprise logistics customers and their exception workflows.' },
      { id: 'tara.fp2', text: 'Some exposure to AI-assisted product work, not yet a clear strength.' },
      { id: 'tara.fp3', text: 'No strong example yet of owning a direction beyond her own features.' },
    ],
  },
]

/** Who still owes a scorecard — the reason an Interview-stage candidate is "waiting on another interviewer". */
export const PENDING_SCORECARDS: Record<string, { reviewer: string; round: string; days: number }> = {
  'rohan-das': { reviewer: 'Engineering Manager', round: 'Round 2 · Panel interview', days: 4 },
  'tara-menon': { reviewer: 'Design Lead', round: 'Round 1 · Design interview', days: 4 },
  'nisha-verma': { reviewer: 'Priya Sharma (you)', round: 'Round 2 · Hiring manager interview', days: 5 },
}

/** Every criterion claim, mapped to the passages it was derived from. */
export const EVIDENCE_SOURCES: Record<string, Partial<Record<CriterionKey, EvidenceSource>>> = {
  'ananya-rao': {
    enterpriseSaas: { passageIds: ['ananya.sum', 'ananya.c1', 'ananya.n2'] },
    complexWorkflows: { passageIds: ['ananya.n2', 'ananya.c2'] },
    aiProductExperience: { passageIds: ['ananya.n1', 'ananya.n3'] },
    designSystems: { passageIds: ['ananya.n4'], note: 'Shows contribution to a shared system, not ownership of it.' },
    leadership: {
      passageIds: ['ananya.n3'],
      note: 'She led an initiative, but nothing says how large it was or whether she managed or mentored other designers.',
    },
  },
  'rahul-mehta': {
    enterpriseSaas: { passageIds: ['rahul.sum', 'rahul.k1'] },
    complexWorkflows: { passageIds: ['rahul.o1', 'rahul.k2'] },
    aiProductExperience: { passageIds: ['rahul.o4'], note: 'One AI-assisted feature; less direct AI-product depth than Ananya.' },
    designSystems: { passageIds: ['rahul.o2'] },
    leadership: { passageIds: ['rahul.o3', 'rahul.k2', 'rahul.o2'] },
  },
  'meera-shah': {
    enterpriseSaas: { passageIds: ['meera.l2'], note: 'B2B operations product for mid-sized companies, not large enterprises.' },
    complexWorkflows: { passageIds: ['meera.p1'] },
    aiProductExperience: { passageIds: ['meera.l1'] },
    designSystems: { passageIds: ['meera.l3'] },
    leadership: { passageIds: [], note: 'No passage describes leading people or initiatives.' },
  },
  'arjun-nair': {
    enterpriseSaas: { passageIds: ['arjun.l1'] },
    complexWorkflows: { passageIds: ['arjun.l3'] },
    aiProductExperience: { passageIds: ['arjun.l4'], note: 'An unshipped prototype is the only AI-related work mentioned.' },
    designSystems: { passageIds: ['arjun.l2'] },
    leadership: { passageIds: ['arjun.l2', 'arjun.t1'] },
  },
  'kavya-iyer': {
    enterpriseSaas: { passageIds: ['kavya.q3'] },
    complexWorkflows: { passageIds: ['kavya.q2'] },
    aiProductExperience: { passageIds: ['kavya.q1'] },
    designSystems: { passageIds: ['kavya.q4'], note: 'Uses a component library; no contribution is described.' },
    leadership: { passageIds: [], note: 'The application does not mention leading people or initiatives.' },
  },
  'vikram-singh': {
    enterpriseSaas: { passageIds: ['vikram.f1'] },
    complexWorkflows: { passageIds: ['vikram.f2'] },
    aiProductExperience: { passageIds: ['vikram.f5'], note: 'Research support on an internal pilot, not shipped AI product work.' },
    designSystems: { passageIds: ['vikram.f3'] },
    leadership: { passageIds: ['vikram.f4'] },
  },
  'dev-malhotra': {
    enterpriseSaas: { passageIds: ['dev.b2'], note: 'B2B education admin, which is adjacent to enterprise operations.' },
    complexWorkflows: { passageIds: ['dev.b3'] },
    aiProductExperience: { passageIds: ['dev.b1'] },
    designSystems: { passageIds: ['dev.b4'] },
    leadership: { passageIds: ['dev.b5'] },
  },
  'sana-khan': {
    enterpriseSaas: { passageIds: ['sana.c1'] },
    aiProductExperience: { passageIds: ['sana.c2'], note: '“Exposure” does not say what she designed.' },
    complexWorkflows: { passageIds: [], note: 'The short-form application does not describe workflow work.' },
    designSystems: { passageIds: [], note: 'Not mentioned in the application.' },
    leadership: { passageIds: [], note: 'Not mentioned in the application.' },
  },
  'nisha-verma': {
    enterpriseSaas: { passageIds: ['nisha.fp2', 'nisha.p1'] },
    complexWorkflows: { passageIds: ['nisha.fd2'] },
    aiProductExperience: { passageIds: ['nisha.fp3', 'nisha.z1'] },
    designSystems: { passageIds: ['nisha.fd1', 'nisha.fd3', 'nisha.p2'] },
    leadership: { passageIds: ['nisha.fp1'], note: 'The Product Lead explicitly wants to validate ownership at a broader product level.' },
  },
  'rohan-das': {
    enterpriseSaas: { passageIds: ['rohan.fp2', 'rohan.h1'] },
    complexWorkflows: { passageIds: ['rohan.fd2'] },
    aiProductExperience: {
      passageIds: ['rohan.fd1'],
      conflict: {
        passageIds: ['rohan.h2'],
        note: 'His resume lists AI-assisted search suggestions, but the Design Lead saw little AI-specific work. Worth asking about directly.',
      },
    },
    designSystems: { passageIds: ['rohan.fd1'], note: 'Craft is praised; there is no design-system ownership story.' },
    leadership: { passageIds: ['rohan.fp1', 'rohan.h3'] },
  },
  'tara-menon': {
    enterpriseSaas: { passageIds: ['tara.fp1', 'tara.n1'] },
    complexWorkflows: { passageIds: ['tara.n1', 'tara.fp1'] },
    aiProductExperience: { passageIds: ['tara.fp2'] },
    designSystems: { passageIds: ['tara.n2'] },
    leadership: { passageIds: ['tara.fp3'] },
  },
  'pooja-reddy': {
    enterpriseSaas: { passageIds: ['pooja.m1'] },
    complexWorkflows: { passageIds: ['pooja.m2'] },
    aiProductExperience: { passageIds: [], note: 'No AI-assisted product work is mentioned.' },
    designSystems: { passageIds: ['pooja.m3'] },
    leadership: { passageIds: ['pooja.m4'] },
  },
}

const resumeByCandidate = new Map(RESUMES.map((resume) => [resume.candidateId, resume]))

export function getResume(candidateId: string): ResumeRecord | undefined {
  return resumeByCandidate.get(candidateId)
}

export function getFeedbackRecords(candidateId: string): FeedbackRecord[] {
  return FEEDBACK.filter((record) => record.candidateId === candidateId)
}

function resumeDocument(resume: ResumeRecord): SourceDocument {
  const blocks: SourceBlock[] = []
  if (resume.summary) blocks.push({ heading: 'Summary', passages: [resume.summary] })
  for (const role of resume.roles) {
    blocks.push({ heading: `${role.role} · ${role.company}`, meta: [role.dateRange, role.location].filter(Boolean).join(' · '), passages: role.points })
  }
  if (resume.portfolio) blocks.push({ heading: resume.portfolio.title, passages: resume.portfolio.points })
  return { id: `resume:${resume.candidateId}`, candidateId: resume.candidateId, kind: 'resume', title: resume.fileName, subtitle: resume.receivedLabel, blocks }
}

function feedbackDocument(record: FeedbackRecord): SourceDocument {
  return {
    id: `feedback:${record.id}`,
    candidateId: record.candidateId,
    kind: 'feedback',
    title: `${record.reviewer} scorecard`,
    subtitle: `${record.round} · ${record.submittedLabel} · Overall: ${record.overall}`,
    blocks: [{ heading: 'Interviewer notes', passages: record.points }],
  }
}

export function getSourceDocuments(candidateId: string): SourceDocument[] {
  const docs: SourceDocument[] = []
  const resume = getResume(candidateId)
  if (resume) docs.push(resumeDocument(resume))
  for (const record of getFeedbackRecords(candidateId)) docs.push(feedbackDocument(record))
  return docs
}

const passageIndex = new Map<string, { passage: Passage; docId: string; candidateId: string; location: string }>()
for (const resume of RESUMES) {
  const doc = resumeDocument(resume)
  for (const block of doc.blocks) for (const passage of block.passages) passageIndex.set(passage.id, { passage, docId: doc.id, candidateId: resume.candidateId, location: block.heading ?? 'Resume' })
}
for (const record of FEEDBACK) {
  for (const passage of record.points) passageIndex.set(passage.id, { passage, docId: `feedback:${record.id}`, candidateId: record.candidateId, location: `${record.reviewer} scorecard` })
}

export function getPassage(passageId: string) {
  return passageIndex.get(passageId)
}

/** Short human label for a citation chip, e.g. "Resume · Northstar AI" or "Design Lead scorecard". */
export function citationLabel(passageId: string): string {
  const entry = passageIndex.get(passageId)
  if (!entry) return 'Unknown source'
  if (entry.docId.startsWith('resume:')) {
    const company = entry.location.includes(' · ') ? entry.location.split(' · ')[1] : entry.location
    return `Resume · ${company}`
  }
  return entry.location
}

export function getEvidenceSource(candidateId: string, criterionKey: CriterionKey): EvidenceSource {
  return EVIDENCE_SOURCES[candidateId]?.[criterionKey] ?? { passageIds: [], note: 'No source document in HireFlow covers this criterion.' }
}

/** Reverse lookup: which criteria does a passage support? Drives "Ask about this passage". */
export function criteriaForPassage(passageId: string): CriterionKey[] {
  const entry = passageIndex.get(passageId)
  if (!entry) return []
  const map = EVIDENCE_SOURCES[entry.candidateId] ?? {}
  return (Object.keys(map) as CriterionKey[]).filter((key) => map[key]?.passageIds.includes(passageId) || map[key]?.conflict?.passageIds.includes(passageId))
}

export function hasSourceDocuments(candidateId: string): boolean {
  return getSourceDocuments(candidateId).length > 0
}
