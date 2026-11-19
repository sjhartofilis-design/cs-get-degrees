// Route table (SPEC §3). Hash routing is set up in main.tsx.
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CheckFormPage from './pages/CheckFormPage'
import DashboardPage from './pages/DashboardPage'
import DecisionPage from './pages/DecisionPage'
import ImportPage from './pages/ImportPage'
import { NotFound } from './pages/NotFound'
import PilotPage from './pages/PilotPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/checks/new" element={<CheckFormPage />} />
        <Route path="/checks/:checkId/edit" element={<CheckFormPage />} />
        <Route path="/checks/:checkId/import" element={<ImportPage />} />
        <Route path="/checks/:checkId/results" element={<ResultsPage />} />
        <Route path="/checks/:checkId/decision" element={<DecisionPage />} />
        <Route path="/pilot" element={<PilotPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
