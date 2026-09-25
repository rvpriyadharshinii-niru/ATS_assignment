import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CandidateEvidencePage } from './pages/CandidateEvidencePage'
import { CandidateExplorationPage } from './pages/CandidateExplorationPage'
import { CopilotWorkspacePage } from './pages/CopilotWorkspacePage'
import { HiringCriteriaPage } from './pages/HiringCriteriaPage'
import { HomePage } from './pages/HomePage'
import { InterviewsPage } from './pages/InterviewsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OpeningsPage } from './pages/OpeningsPage'
import { PipelinePage } from './pages/PipelinePage'
import { RoleWorkspaceLayout } from './pages/RoleWorkspaceLayout'
import { RoleWorkspaceOverviewPage } from './pages/RoleWorkspaceOverviewPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/openings/:openingId" element={<RoleWorkspaceLayout />}>
          <Route index element={<RoleWorkspaceOverviewPage />} />
          <Route path="candidates" element={<CandidateExplorationPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="criteria" element={<HiringCriteriaPage />} />
        </Route>
        <Route path="/candidates/:candidateId" element={<CandidateEvidencePage />} />
        <Route path="/copilot" element={<CopilotWorkspacePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
