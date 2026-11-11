import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { AppShell } from './layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import LeavePage from './pages/LeavePage'
import AttendancePage from './pages/AttendancePage'
import PayrollPage from './pages/PayrollPage'
import RelationsPage from './pages/RelationsPage'
import BillingPage from './pages/BillingPage'
import DirectoriesPage from './pages/DirectoriesPage'
import ProfilePage from './pages/ProfilePage'
import { DataProvider } from './store/DataProvider'

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p className="p-6 text-mu">Loading…</p>

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route
        element={
          <DataProvider>
            <AppShell />
          </DataProvider>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/relations" element={<RelationsPage />} />
        {/* Billing is Admin and CEO only (spec 5.5). The server enforces this too. */}
        <Route path="/billing" element={user.role === 'Staff' ? <Navigate to="/" replace /> : <BillingPage />} />
        <Route path="/directories" element={<DirectoriesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
