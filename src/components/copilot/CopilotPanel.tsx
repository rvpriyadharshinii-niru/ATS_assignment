import { Sparkles, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { getCandidate } from '../../data/candidates'
import { useCopilotScope } from '../../copilot/useCopilotScope'
import { useAppStore } from '../../store/useAppStore'
import { CopilotResultView } from './CopilotResultView'

function useSuggestions(): string[] {
  const openingId = useAppStore((state) => state.selectedOpeningId)
  const candidateId = useAppStore((state) => state.selectedCandidateId)

  if (candidateId) {
    const candidate = getCandidate(candidateId)
    return candidate ? [`Why ${candidate.name.split(' ')[0]}?`] : []
  }
  if (openingId) {
    return ['Who should I review?', 'Show candidates strongest in design systems', 'Prioritize AI product experience']
  }
  return []
}

export function CopilotPanel() {
  const closeCopilot = useAppStore((state) => state.closeCopilot)
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)
  const history = useAppStore((state) => state.copilotHistory)
  const { label } = useCopilotScope()
  const suggestions = useSuggestions()
  const [draft, setDraft] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = draft.trim()
    if (!query) return
    submitCopilotMessage(query)
    setDraft('')
  }

  return (
    <div className="fixed bottom-6 right-6 top-6 z-50 flex w-[440px] max-w-[calc(100vw-3rem)] flex-col rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Copilot</p>
            <p className="truncate text-xs text-neutral-500">{label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeCopilot}
          aria-label="Close Copilot"
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {history.length === 0 ? (
          <div>
            <p className="text-sm leading-relaxed text-neutral-500">
              Ask about candidates, evidence or recommendations for {label}.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-3 flex flex-col items-start gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submitCopilotMessage(suggestion)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((turn) => (
              <div key={turn.id}>
                <p className="border-l-2 border-neutral-200 pl-2.5 text-sm text-neutral-500">{turn.query}</p>
                <div className="mt-2.5">
                  <CopilotResultView result={turn.result} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-neutral-100 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask Copilot about your hiring…"
            aria-label="Ask Copilot"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={draft.trim().length === 0}
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  )
}
