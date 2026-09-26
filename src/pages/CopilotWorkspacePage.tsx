import { ArrowLeft, MessageSquarePlus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CopilotResultView } from '../components/copilot/CopilotResultView'
import { cn } from '../lib/cn'
import { useAppStore } from '../store/useAppStore'

const SUGGESTED_PROMPTS = ['Who needs my attention today?', 'Review Product Manager candidates', 'Where are my pipelines blocked?']

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function groupLabel(createdAt: number): string {
  const today = startOfDay(Date.now())
  const day = startOfDay(createdAt)
  if (day === today) return 'Today'
  if (day === today - 24 * 60 * 60 * 1000) return 'Yesterday'
  return 'Older'
}

export function CopilotWorkspacePage() {
  const conversations = useAppStore((state) => state.conversations)
  const conversationOrder = useAppStore((state) => state.conversationOrder)
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const startNewConversation = useAppStore((state) => state.startNewConversation)
  const selectConversation = useAppStore((state) => state.selectConversation)
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)
  const copilotExpandedFrom = useAppStore((state) => state.copilotExpandedFrom)
  const returnToCopilotOrigin = useAppStore((state) => state.returnToCopilotOrigin)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const activeConversation = activeConversationId ? conversations[activeConversationId] : undefined
  const turns = activeConversation?.turns ?? []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns.length])

  const groups: { label: string; ids: string[] }[] = []
  for (const id of conversationOrder) {
    const conversation = conversations[id]
    if (!conversation) continue
    const label = groupLabel(conversation.createdAt)
    const existing = groups.find((group) => group.label === label)
    if (existing) existing.ids.push(id)
    else groups.push({ label, ids: [id] })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = draft.trim()
    if (!query) return
    submitCopilotMessage(query, { ignorePageContext: true })
    setDraft('')
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[image:var(--gradient-brand_wash)] text-background shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-palette-neutral-900">Copilot</span>
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-palette-neutral-600">Recent</p>
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-1.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">{group.label}</p>
              <div className="space-y-0.5">
                {group.ids.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectConversation(id)}
                    title={conversations[id]?.title}
                    className={cn(
                      'block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      id === activeConversationId
                        ? 'bg-palette-brand-150 font-medium text-palette-brand-700'
                        : 'text-palette-neutral-600 hover:bg-muted hover:text-palette-neutral-900',
                    )}
                  >
                    {conversations[id]?.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-palette-neutral-100/40">
        {copilotExpandedFrom && (
          <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-2.5">
            <button
              type="button"
              onClick={() => returnToCopilotOrigin(navigate)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to {copilotExpandedFrom.label}
            </button>
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-palette-neutral-500">Working context</span> · {copilotExpandedFrom.label}
            </p>
          </div>
        )}
        {turns.length === 0 ? (
          <div className="flex flex-1 flex-col items-center px-8 pt-24">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand_wash)] text-background shadow-sm">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-palette-neutral-900">What can I help you with?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ask across every role you own — candidates, pipelines, comparisons or actions.</p>
            <div className="mt-6 flex w-full max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitCopilotMessage(prompt, { ignorePageContext: true })}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-palette-brand-250 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {turns.map((turn) => (
                <div key={turn.id} className="space-y-2.5">
                  <div className="flex justify-end">
                    <p className="max-w-[75%] rounded-2xl rounded-tr-sm bg-palette-brand-550 px-4 py-2.5 text-sm text-white">{turn.query}</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palette-brand-100 text-primary">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 max-w-[75%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-xs">
                      <CopilotResultView turnId={turn.id} result={turn.result} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Copilot about your hiring…"
              aria-label="Ask Copilot"
              className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-palette-neutral-900 placeholder:text-palette-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={draft.trim().length === 0}
            >
              Ask
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
