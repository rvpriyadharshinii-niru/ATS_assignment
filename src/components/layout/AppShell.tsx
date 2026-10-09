import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AskAiButton } from './AskAiButton'
import { Sidebar } from './Sidebar'
import { ToastStack } from './ToastStack'

export function AppShell() {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const isWorkspace = pathname.startsWith('/workspace')

  return (
    <div className="flex h-svh bg-palette-neutral-150">
      <Sidebar className="hidden md:flex" />
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-palette-neutral-900/30" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
          <Sidebar className="relative z-10 shadow-xl" onNavigate={() => setNavOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-3 md:hidden">
          <button type="button" onClick={() => setNavOpen(true)} className="rounded-md p-1.5 text-palette-neutral-700 hover:bg-muted" aria-label="Open navigation">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold text-palette-neutral-900">HireFlow</span>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
          <div className={isWorkspace ? 'h-full' : 'h-full overflow-y-auto'}>
            <Outlet />
          </div>
        </main>
      </div>
      <AskAiButton />
      <ToastStack />
    </div>
  )
}
