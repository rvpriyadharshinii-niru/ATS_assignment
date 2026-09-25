import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CandidateEvidencePage } from './pages/CandidateEvidencePage'
import { CandidateExplorationPage } from './pages/CandidateExplorationPage'
import { HomePage } from './pages/HomePage'
import { OpeningsPage } from './pages/OpeningsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/openings/:openingId" element={<CandidateExplorationPage />} />
        <Route path="/candidates/:candidateId" element={<CandidateEvidencePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
