import { Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { CopilotLauncher } from '../copilot/CopilotLauncher'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const copilotExpanded = useAppStore((state) => state.copilotExpanded)

  return (
    <div className="flex h-svh bg-palette-neutral-100">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {copilotExpanded ? <CopilotPanel /> : <CopilotLauncher />}
    </div>
  )
}
