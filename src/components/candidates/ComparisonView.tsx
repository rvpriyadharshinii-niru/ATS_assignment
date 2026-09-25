import { Link } from 'react-router-dom'
import { isUncertainStrength } from '../../lib/evidence'
import type { Candidate, HiringCriterion } from '../../types/domain'
import { cn } from '../../lib/cn'
import { RecommendationBadge } from './RecommendationBadge'

const STRENGTH_CELL_TONE: Record<string, string> = {
  Strong: 'text-palette-success-700',
  Good: 'text-palette-info-700',
  Moderate: 'text-palette-neutral-600',
  Limited: 'text-palette-neutral-600',
  Possible: 'text-palette-warning-700',
  Unclear: 'text-palette-warning-700',
  'Not available': 'text-palette-warning-700',
}

export function ComparisonView({ candidates, criteria, summary }: { candidates: Candidate[]; criteria: HiringCriterion[]; summary?: string }) {
  return (
    <div>
      {summary && <p className="text-sm leading-relaxed text-foreground">{summary}</p>}

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">Criterion</th>
              {candidates.map((candidate) => (
                <th key={candidate.id} className="px-3 py-2.5 text-left">
                  <Link to={`/candidates/${candidate.id}`} className="block text-sm font-semibold text-palette-neutral-900 hover:text-primary">
                    {candidate.name}
                  </Link>
                  {candidate.recommendation && (
                    <span className="mt-1 inline-block">
                      <RecommendationBadge label={candidate.recommendation} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion.key} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 text-foreground">{criterion.name}</td>
                {candidates.map((candidate) => {
                  const evidence = candidate.evidence.find((item) => item.criterionKey === criterion.key)
                  const strength = evidence?.strength ?? 'Not available'
                  return (
                    <td key={candidate.id} className={cn('px-3 py-2.5 font-medium', STRENGTH_CELL_TONE[strength])}>
                      {strength === 'Not available' ? 'Insufficient evidence' : strength}
                      {isUncertainStrength(strength) && strength !== 'Not available' && <span className="text-palette-neutral-400"> ·</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-b border-border">
              <td className="px-3 py-2.5 text-foreground">Experience</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="px-3 py-2.5 text-foreground">
                  {candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs` : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2.5 text-foreground">Screening score</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="px-3 py-2.5 text-foreground">
                  {candidate.screeningScore ?? '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2.5 text-foreground">Current stage</td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="px-3 py-2.5 text-foreground">
                  {candidate.stage}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
