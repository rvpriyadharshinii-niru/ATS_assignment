import { Sparkles } from 'lucide-react'
import { useCopilotScope } from '../../copilot/useCopilotScope'
import { useAppStore } from '../../store/useAppStore'

export function CopilotLauncher() {
  const openCopilot = useAppStore((state) => state.openCopilot)
  const { level, label } = useCopilotScope()

  return (
    <button
      type="button"
      onClick={openCopilot}
      className="fixed bottom-6 right-6 flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white py-2.5 pl-3.5 pr-4 shadow-lg shadow-neutral-900/5 transition-colors hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-sm font-medium text-neutral-900">Ask Copilot</span>
        {level !== 'global' && <span className="block text-xs text-neutral-500">{label}</span>}
      </span>
    </button>
  )
}
