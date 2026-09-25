import { X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function FilterChips() {
  const filters = useAppStore((state) => state.filters)
  const removeFilter = useAppStore((state) => state.removeFilter)

  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-3 pr-1.5 text-xs font-medium text-indigo-700"
        >
          {filter.label}
          <button
            type="button"
            onClick={() => removeFilter(filter.id)}
            aria-label={`Remove filter ${filter.label}`}
            className="rounded-full p-0.5 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  )
}
