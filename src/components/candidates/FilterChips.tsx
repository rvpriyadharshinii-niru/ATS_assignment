import { Sparkles, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAppStore } from '../../store/useAppStore'
import type { CandidateFilter } from '../../types/domain'

function Chip({ filter, onRemove }: { filter: CandidateFilter; onRemove: () => void }) {
  const isAi = filter.source === 'ai'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-medium ring-1 ring-inset',
        isAi ? 'bg-accent text-accent-foreground ring-palette-brand-300/40' : 'bg-palette-neutral-150 text-palette-neutral-700 ring-palette-neutral-400/20',
      )}
    >
      {filter.label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${filter.label}`}
        className={cn(
          'rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isAi
            ? 'text-palette-brand-600 hover:bg-palette-brand-200 hover:text-palette-brand-700'
            : 'text-palette-neutral-500 hover:bg-palette-neutral-250 hover:text-palette-neutral-700',
        )}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  )
}

export function FilterChips() {
  const filters = useAppStore((state) => state.filters)
  const removeFilter = useAppStore((state) => state.removeFilter)

  if (filters.length === 0) return null

  const aiFilters = filters.filter((filter) => filter.source === 'ai')
  const manualFilters = filters.filter((filter) => filter.source === 'manual')

  return (
    <div className="flex flex-wrap items-center gap-3">
      {aiFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI applied
          </span>
          {aiFilters.map((filter) => (
            <Chip key={filter.id} filter={filter} onRemove={() => removeFilter(filter.id)} />
          ))}
        </div>
      )}
      {manualFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {manualFilters.map((filter) => (
            <Chip key={filter.id} filter={filter} onRemove={() => removeFilter(filter.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
