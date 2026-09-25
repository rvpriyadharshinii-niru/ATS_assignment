import { Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { CopilotLauncher } from '../copilot/CopilotLauncher'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const copilotExpanded = useAppStore((state) => state.copilotExpanded)

  return (
    <div className="flex h-svh bg-palette-brand-100">
      <Sidebar />
      <div className="min-w-0 flex-1 p-3 pl-0">
        <main className="h-full min-w-0 overflow-hidden rounded-3xl bg-background shadow-sm">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {copilotExpanded ? <CopilotPanel /> : <CopilotLauncher />}
    </div>
  )
}
