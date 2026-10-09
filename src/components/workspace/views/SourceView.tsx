import { FileText, FileX, MousePointerClick, Quote, Scale } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCandidate } from '../../../data/candidates'
import { getCriteria } from '../../../data/criteria'
import { criteriaForPassage, getEvidenceSource, getSourceDocuments } from '../../../data/sources'
import { cn } from '../../../lib/cn'
import { useWorkspaceStore } from '../../../store/useWorkspaceStore'
import type { CriterionKey } from '../../../types/domain'
import type { WorkspaceTask } from '../../../types/workspace'
import { evidenceFor, firstName } from '../../../workspace/derive'
import { EmptyState, StrengthPill } from '../ui'
import { btn } from '../styles'

/**
 * The original document, with the passages behind a claim highlighted. Clicking a passage makes it
 * the conversation's context, so "Does this demonstrate ownership?" is about exactly that text.
 */
export function SourceView({ task, candidateId, passageIds, criterionKey }: { task: WorkspaceTask; candidateId: string; passageIds: string[]; criterionKey?: CriterionKey }) {
  const candidate = getCandidate(candidateId)
  const docs = useMemo(() => getSourceDocuments(candidateId), [candidateId])
  const selectPassage = useWorkspaceStore((state) => state.selectPassage)
  const send = useWorkspaceStore((state) => state.send)
  const setView = useWorkspaceStore((state) => state.setView)
  const source = criterionKey ? getEvidenceSource(candidateId, criterionKey) : undefined
  const conflictIds = new Set(source?.conflict?.passageIds ?? [])
  const highlighted = new Set(passageIds)
  const initialDoc = docs.find((doc) => doc.blocks.some((block) => block.passages.some((passage) => highlighted.has(passage.id))))?.id ?? docs[0]?.id
  // Reset the open document whenever the cited passage moves to a different document.
  const [docState, setDocState] = useState({ initial: initialDoc, id: initialDoc })
  if (docState.initial !== initialDoc) setDocState({ initial: initialDoc, id: initialDoc })
  const docId = docState.initial === initialDoc ? docState.id : initialDoc
  const setDocId = (id: string) => setDocState({ initial: initialDoc, id })
  const activeDoc = docs.find((doc) => doc.id === docId) ?? docs[0]
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first = containerRef.current?.querySelector('[data-highlighted="true"]')
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [docId, passageIds])

  if (!candidate) return null
  if (!docs.length) {
    return <EmptyState icon={FileX} title="No documents on file" body={`HireFlow has no resume or scorecard for ${candidate.name}. Nothing can be cited, so no claims are made.`} />
  }
  const criteria = getCriteria(candidate.openingId)
  const criterion = criteria.find((entry) => entry.key === criterionKey)
  const evidence = criterionKey ? evidenceFor(candidate, criterionKey) : undefined
  const countIn = (id: string) => docs.find((doc) => doc.id === id)?.blocks.reduce((sum, block) => sum + block.passages.filter((passage) => highlighted.has(passage.id)).length, 0) ?? 0

  return (
    <div className="space-y-4">
      {criterion ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-palette-neutral-550">Criterion being evaluated</p>
            <span className="text-[11px] text-palette-neutral-500">{criterion.priority} priority</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-palette-neutral-900">{criterion.name}</p>
            {evidence && <StrengthPill strength={evidence.strength} />}
          </div>
          {criterion.description && <p className="mt-1 text-xs text-palette-neutral-600">Looks for: {criterion.description}</p>}
          {evidence && <p className="mt-2 text-sm text-palette-neutral-800">AI claim: “{evidence.detail}”</p>}
          {source?.note && <p className="mt-1.5 text-xs text-palette-neutral-600">{source.note}</p>}
          {source?.conflict && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-palette-warning-700">
              <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {source.conflict.note}
            </p>
          )}
          {!passageIds.length && <p className="mt-2 rounded-md bg-palette-warning-100 px-2.5 py-1.5 text-xs font-medium text-palette-warning-700">No passage in these documents covers this criterion.</p>}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-palette-neutral-600">
          <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
          Highlighted passages back the AI's Good or Strong ratings. Click any passage to ask about it.
        </p>
      )}

      {docs.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Documents">
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              role="tab"
              aria-selected={doc.id === activeDoc.id}
              onClick={() => setDocId(doc.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                doc.id === activeDoc.id ? 'bg-palette-neutral-900 text-white' : 'bg-palette-neutral-200 text-palette-neutral-700 hover:bg-palette-neutral-250',
              )}
            >
              {doc.kind === 'resume' ? <FileText className="h-3.5 w-3.5" aria-hidden="true" /> : <Quote className="h-3.5 w-3.5" aria-hidden="true" />}
              {doc.kind === 'resume' ? 'Resume' : doc.title}
              {countIn(doc.id) > 0 && <span className="rounded bg-palette-warning-300 px-1 text-[10px] font-semibold text-palette-warning-800">{countIn(doc.id)}</span>}
            </button>
          ))}
        </div>
      )}

      <article ref={containerRef} className="rounded-xl border border-border bg-white shadow-xs">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-palette-neutral-550">
            {activeDoc.kind === 'resume' ? <FileText className="h-3.5 w-3.5" aria-hidden="true" /> : <Quote className="h-3.5 w-3.5" aria-hidden="true" />}
            {activeDoc.title}
          </div>
          {activeDoc.kind === 'resume' ? (
            <>
              <h3 className="mt-2 text-lg font-semibold text-palette-neutral-900">{candidate.name}</h3>
              <p className="text-sm text-palette-neutral-600">{[candidate.currentRole, candidate.currentCompany, candidate.location].filter(Boolean).join(' · ')}</p>
            </>
          ) : (
            <h3 className="mt-2 text-base font-semibold text-palette-neutral-900">
              {activeDoc.title} · {candidate.name}
            </h3>
          )}
          <p className="mt-0.5 text-xs text-palette-neutral-500">{activeDoc.subtitle}</p>
          {activeDoc.kind === 'feedback' && <p className="mt-1 text-[11px] text-palette-neutral-500">Written by the interviewer. Quoted verbatim; never generated.</p>}
        </header>
        <div className="space-y-5 px-6 py-5">
          {activeDoc.blocks.map((block) => (
            <section key={`${block.heading}-${block.meta}`}>
              {block.heading && <h4 className="text-sm font-semibold text-palette-neutral-900">{block.heading}</h4>}
              {block.meta && <p className="text-xs text-palette-neutral-500">{block.meta}</p>}
              <ul className="mt-2 space-y-1.5">
                {block.passages.map((passage) => {
                  const isHighlighted = highlighted.has(passage.id)
                  const isConflict = conflictIds.has(passage.id)
                  const isSelected = task.selectedPassageId === passage.id
                  const supports = criteriaForPassage(passage.id)
                  return (
                    <li key={passage.id} data-highlighted={isHighlighted ? 'true' : undefined}>
                      <button
                        type="button"
                        onClick={() => selectPassage(task.id, isSelected ? null : passage.id)}
                        className={cn(
                          'w-full rounded-md px-2 py-1 text-left text-[13.5px] leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isConflict
                            ? 'bg-palette-plum-100 text-palette-neutral-900 ring-1 ring-inset ring-palette-plum-300'
                            : isHighlighted
                              ? 'bg-palette-warning-200 text-palette-neutral-900'
                              : 'text-palette-neutral-700 hover:bg-palette-neutral-150',
                          isSelected && 'ring-2 ring-primary',
                        )}
                      >
                        <span className="mr-1 text-palette-neutral-400">•</span>
                        {passage.text}
                        {(isHighlighted || isSelected) && supports.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {supports.map((key) => (
                              <span key={key} className="rounded bg-white/80 px-1.5 py-0.5 text-[10.5px] font-semibold text-palette-neutral-700 ring-1 ring-inset ring-palette-neutral-300">
                                {isConflict && key === criterionKey ? 'Conflicts with rating: ' : 'Supports: '}
                                {criteria.find((entry) => entry.key === key)?.name}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </article>

      {task.selectedPassageId && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-xl border border-palette-brand-250 bg-palette-brand-100 p-3 shadow-md">
          <p className="mr-auto text-xs font-medium text-palette-brand-800">Passage selected. Ask about it:</p>
          {['How relevant is this experience?', 'Does this demonstrate ownership?', 'What should I validate in the interview?'].map((prompt) => (
            <button key={prompt} type="button" className={btn.chip} onClick={() => send(task.id, prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={() => setView(task.id, { type: 'candidate', candidateId })}>
          Back to {firstName(candidate)}'s evidence summary
        </button>
      </div>
    </div>
  )
}
