import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ActivityPage } from './pages/ActivityPage'
import { AgentActivityPage } from './pages/AgentActivityPage'
import { AgentConfigurePage } from './pages/AgentConfigurePage'
import { AgentDetailLayout } from './pages/AgentDetailLayout'
import { AgentsWorkspacePage } from './pages/AgentsWorkspacePage'
import { AgentTestPage } from './pages/AgentTestPage'
import { CandidateEvidencePage } from './pages/CandidateEvidencePage'
import { CandidateExplorationPage } from './pages/CandidateExplorationPage'
import { CandidatesPage } from './pages/CandidatesPage'
import { HiringCriteriaPage } from './pages/HiringCriteriaPage'
import { HomePage } from './pages/HomePage'
import { InterviewsPage } from './pages/InterviewsPage'
import { OpeningsPage } from './pages/OpeningsPage'
import { PipelinePage } from './pages/PipelinePage'
import { RoleWorkspaceLayout } from './pages/RoleWorkspaceLayout'
import { RoleWorkspaceOverviewPage } from './pages/RoleWorkspaceOverviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { WorkspacePage } from './pages/WorkspacePage'

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
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/workspace/:taskId" element={<WorkspacePage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/:candidateId" element={<CandidateEvidencePage />} />
        <Route path="/copilot" element={<Navigate to="/workspace" replace />} />
        <Route path="/pipeline" element={<Navigate to="/openings/senior-product-designer/pipeline" replace />} />
        <Route path="/agents" element={<AgentsWorkspacePage />} />
        <Route path="/agents/:agentId" element={<AgentDetailLayout />}>
          <Route index element={<Navigate to="configure" replace />} />
          <Route path="configure" element={<AgentConfigurePage />} />
          <Route path="test" element={<AgentTestPage />} />
          <Route path="activity" element={<AgentActivityPage />} />
        </Route>
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/notifications" element={<Navigate to="/activity" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
