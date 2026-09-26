import { Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { CopilotLauncher } from '../copilot/CopilotLauncher'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { Sidebar } from './Sidebar'
import { ToastStack } from './ToastStack'

export function AppShell() {
  const copilotExpanded = useAppStore((state) => state.copilotExpanded)
  const { pathname } = useLocation()
  const isCopilotWorkspace = pathname === '/copilot'

  // Docked, not floating: opening Copilot resizes the workspace next to it rather than covering or
  // dimming it, so Priya can see the product respond while she talks to Copilot (a Rovo-style dock).
  const showDock = copilotExpanded && !isCopilotWorkspace

  return (
    <div className="flex h-svh bg-palette-brand-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 gap-3 p-3">
        <main className="h-full min-w-0 flex-1 overflow-hidden rounded-2xl bg-background shadow-sm">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
        {showDock && (
          <aside className="h-full w-[420px] shrink-0 overflow-hidden rounded-2xl border border-border bg-background shadow-md">
            <CopilotPanel />
          </aside>
        )}
      </div>
      {/* The standalone workspace IS the Copilot UI here — no floating launcher/panel duplicate. */}
      {!isCopilotWorkspace && !copilotExpanded && <CopilotLauncher />}
      <ToastStack />
    </div>
  )
}
