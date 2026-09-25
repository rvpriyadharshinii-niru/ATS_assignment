import { Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { CopilotLauncher } from '../copilot/CopilotLauncher'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const copilotExpanded = useAppStore((state) => state.copilotExpanded)

  return (
    <div className="flex h-svh gap-3 bg-palette-neutral-250 p-3">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden rounded-3xl bg-background shadow-sm">
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
      {copilotExpanded ? <CopilotPanel /> : <CopilotLauncher />}
    </div>
  )
}
