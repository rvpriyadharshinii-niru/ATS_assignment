import { CircleHelp, MessageSquareQuote, ShieldCheck } from 'lucide-react'
import { getCandidate } from '../../data/candidates'
import { cn } from '../../lib/cn'
import type { InterviewGuide, InterviewGuideItem } from '../../types/agents'
import { SimulatedTag } from './agentUi'

const GUARDRAILS = [
  'Ask every candidate the core questions, so comparisons are fair.',
  'Don’t ask about age, family, health, religion, nationality or other personal circumstances.',
  'Treat anything the candidate doesn’t mention as unknown, not as a weakness.',
  'Score against the requirements, not against other candidates.',
]

function GuideItem({ item, tone }: { item: InterviewGuideItem; tone: 'validate' | 'explore' }) {
  return (
    <li className="rounded-lg border border-border p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tone === 'validate' ? 'bg-palette-warning-150 text-palette-warning-700' : 'bg-palette-success-150 text-palette-success-700')}>
          {item.requirement}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-palette-neutral-700">Candidate evidence: </span>
        {item.candidateEvidence}
        {item.evidenceSource !== 'Not available' && <span className="text-palette-neutral-500"> · {item.evidenceSource}</span>}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-palette-neutral-700">Why ask: </span>
        {item.why}
      </p>
      <ol className="mt-2 space-y-1.5">
        {item.questions.map((question, index) => (
          <li key={question} className="flex gap-2 text-sm leading-relaxed text-palette-neutral-900">
            <span className="shrink-0 font-semibold text-palette-neutral-500">{index + 1}.</span>
            {question}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs leading-relaxed text-foreground/90">
        <span className="font-medium text-palette-neutral-700">Listen for: </span>
        {item.listenFor}
      </p>
    </li>
  )
}

export function InterviewGuideView({ guide }: { guide: InterviewGuide }) {
  const candidate = getCandidate(guide.candidateId)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-palette-brand-200 bg-palette-brand-100/30 p-5 shadow-xs">
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary">Interview guide</span>
          <SimulatedTag />
        </p>
        <p className="mt-1.5 text-base font-semibold text-palette-neutral-900">
          {candidate?.name} · {guide.roundType} · {guide.minutes} min
        </p>
        <p className="mt-1 text-sm text-foreground/90">
          {guide.validate.length} area{guide.validate.length === 1 ? '' : 's'} to validate, {guide.explore.length} to explore further, plus {guide.consistent.length} core questions for every candidate.
        </p>
        {guide.limitedEvidence && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-palette-warning-150 px-3 py-2 text-sm text-palette-warning-700">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            No candidate-specific evidence is recorded yet, so this guide is built from the role&rsquo;s requirements only. It makes no assumptions about the candidate.
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Based on: {guide.informationUsed.join(' · ')}</p>
      </div>

      {guide.validate.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-palette-neutral-900">Areas to validate</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Evidence is unclear, missing or limited. Give the candidate a fair chance to show it.</p>
          <ul className="mt-3 space-y-3">
            {guide.validate.map((item) => (
              <GuideItem key={item.requirement} item={item} tone="validate" />
            ))}
          </ul>
        </section>
      )}

      {guide.explore.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-palette-neutral-900">Areas to explore further</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Evidence is already supportive — check depth and personal contribution.</p>
          <ul className="mt-3 space-y-3">
            {guide.explore.map((item) => (
              <GuideItem key={item.requirement} item={item} tone="explore" />
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-palette-neutral-900">Core questions for every candidate</h3>
          <ol className="mt-2 space-y-1.5">
            {guide.consistent.map((question, index) => (
              <li key={question} className="flex gap-2 text-sm text-palette-neutral-900">
                <span className="shrink-0 font-semibold text-palette-neutral-500">{index + 1}.</span>
                {question}
              </li>
            ))}
          </ol>
          {guide.priorFeedback.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">
                <MessageSquareQuote className="h-3 w-3" aria-hidden="true" />
                From earlier rounds
              </p>
              <ul className="mt-1.5 space-y-1">
                {guide.priorFeedback.map((entry) => (
                  <li key={entry.reviewer} className="text-sm text-foreground">
                    <span className="font-medium">{entry.reviewer}:</span> “{entry.quote}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-palette-neutral-900">
            <ShieldCheck className="h-4 w-4 text-palette-success-600" aria-hidden="true" />
            Fair-interview guardrails
          </h3>
          <ul className="mt-2 space-y-1.5">
            {GUARDRAILS.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-palette-neutral-400" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
