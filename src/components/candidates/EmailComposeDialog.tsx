import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'
import { buildDefaultEmail } from '../../lib/email'
import { useAppStore } from '../../store/useAppStore'
import type { Candidate } from '../../types/domain'

function EmailComposeForm({ candidate, onOpenChange }: { candidate: Candidate; onOpenChange: (open: boolean) => void }) {
  const sendEmail = useAppStore((state) => state.sendEmail)
  const defaults = buildDefaultEmail(candidate)
  const [subject, setSubject] = useState(defaults.subject)
  const [body, setBody] = useState(defaults.body)

  return (
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title className="text-base font-semibold text-palette-neutral-900">Email {candidate.name}</Dialog.Title>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="rounded-md p-1.5 text-palette-neutral-400 hover:bg-muted hover:text-palette-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </Dialog.Close>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-muted-foreground">
          To
          <p className="mt-0.5 text-sm text-foreground">{candidate.name}</p>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Message
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Dialog.Close asChild>
          <button
            type="button"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
        </Dialog.Close>
        <button
          type="button"
          onClick={() => {
            sendEmail(candidate.id, subject, body)
            onOpenChange(false)
          }}
          className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Send email
        </button>
      </div>
    </Dialog.Content>
  )
}

export function EmailComposeDialog({ open, onOpenChange, candidate }: { open: boolean; onOpenChange: (open: boolean) => void; candidate: Candidate }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-palette-neutral-900/30" />
        {/* Mounted only while open, so its draft state (initialized from buildDefaultEmail) is
            always fresh the next time it's opened — no effect needed to reset stale edits. */}
        {open && <EmailComposeForm candidate={candidate} onOpenChange={onOpenChange} />}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
