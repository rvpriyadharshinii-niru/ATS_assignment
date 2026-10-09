import { ArrowUp, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getCandidate } from '../../data/candidates'
import { getOpening } from '../../data/openings'
import { useAppStore } from '../../store/useAppStore'
import { useLaunchTask } from '../../workspace/presets'
import { btn } from '../workspace/styles'

/**
 * Contextual AI on every manual page. It doesn't open a chat on top of the page: it starts a task
 * in the AI Workspace that already knows which candidate or job you were looking at.
 */
export function AskAiButton() {
  const { pathname } = useLocation()
  const launch = useLaunchTask()
  const selectedCandidateId = useAppStore((state) => state.selectedCandidateId)
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onCandidate = pathname.startsWith('/candidates/')
  const candidate = onCandidate ? getCandidate(selectedCandidateId ?? undefined) : undefined
  const opening = !candidate && pathname.startsWith('/openings/') ? getOpening(selectedOpeningId ?? undefined) : undefined
  const first = candidate?.name.split(' ')[0]

  const suggestions = candidate
    ? [`Why ${first}?`, `What are the gaps for ${first}?`, `Prepare interview questions for ${first}`, `Show me the evidence for ${first}`]
    : opening
      ? ["Review today's new applicants", 'What needs attention in my hiring pipeline?', 'Why is the Product Designer role delayed?']
      : ['What needs my attention today?', "Review today's new applicants", 'Help me clear my pending hiring tasks']

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (query: string) => {
    if (!query.trim()) return
    // A request typed on a candidate page that doesn't name anyone is about that candidate.
    const scoped = candidate && !query.toLowerCase().includes(first!.toLowerCase()) ? `${query} (${candidate.name})` : query
    launch(scoped, candidate ? { candidateIds: [candidate.id] } : undefined)
    setOpen(false)
    setText('')
  }

  if (pathname.startsWith('/workspace')) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(420px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-card p-3 shadow-xl" role="dialog" aria-label="Ask HireFlow AI">
          <div className="flex items-center gap-2 px-1 pb-2">
            <Sparkles className="h-4 w-4 text-palette-brand-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-palette-neutral-900">Ask HireFlow AI</p>
            {(candidate || opening) && <span className="truncate rounded-md bg-palette-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-palette-neutral-700">Context: {candidate?.name ?? opening?.title}</span>}
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded p-1 text-palette-neutral-500 hover:bg-muted" aria-label="Close">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              go(text)
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary"
          >
            <input ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} placeholder="Describe what you need done…" className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" aria-label="Request" />
            <button type="submit" disabled={!text.trim()} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40" aria-label="Start task">
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className={btn.chip} onClick={() => go(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <p className="mt-2 px-1 text-[11px] text-palette-neutral-500">Opens a task in the AI Workspace. Nothing changes until you approve it.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-palette-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-palette-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Ask AI
        <kbd className="hidden rounded bg-white/15 px-1.5 text-[10px] font-medium sm:inline">⌘K</kbd>
      </button>
    </div>
  )
}
