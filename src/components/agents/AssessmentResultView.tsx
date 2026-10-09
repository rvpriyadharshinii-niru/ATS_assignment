import { cn } from '../../lib/cn'
import type { AssessmentResult } from '../../types/agents'
import { SimulatedTag } from './agentUi'

const RATING_TONE: Record<string, string> = {
  Meets: 'bg-palette-success-150 text-palette-success-700',
  'Partially meets': 'bg-palette-info-150 text-palette-info-700',
  'Not evidenced': 'bg-palette-warning-150 text-palette-warning-700',
  'Not evaluated': 'bg-palette-neutral-150 text-palette-neutral-600',
}

export function AssessmentResultView({ result }: { result: AssessmentResult }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-palette-neutral-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-palette-neutral-900">{result.title}</p>
          <p className="text-xs text-muted-foreground">
            {result.status}
            {result.submittedLabel ? ` · ${result.submittedLabel}` : ''}
          </p>
        </div>
        <SimulatedTag />
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed text-foreground">{result.summary}</p>
      {result.items.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {result.items.map((item, index) => (
            <li key={item.questionId} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-palette-neutral-900">
                  <span className="font-semibold">Q{index + 1}</span>
                  {item.criterionName && <span className="text-xs text-muted-foreground"> · {item.criterionName}</span>}
                </p>
                <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', RATING_TONE[item.rating])}>{item.rating}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.prompt}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{item.evidence}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
