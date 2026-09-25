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
        isAi ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-neutral-100 text-neutral-700 ring-neutral-300',
      )}
    >
      {filter.label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${filter.label}`}
        className={cn(
          'rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          isAi ? 'text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700' : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700',
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
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
