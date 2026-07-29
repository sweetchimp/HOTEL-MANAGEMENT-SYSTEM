import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import WelcomePage from './pages/WelcomePage'
import DashboardPage from './pages/DashboardPage'
import RoomsPage from './pages/RoomsPage'
import GuestsPage from './pages/GuestsPage'
import ReservationsPage from './pages/ReservationsPage'
import CheckInPage from './pages/CheckInPage'
import CheckOutPage from './pages/CheckOutPage'
import BillingPage from './pages/BillingPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="checkout" element={<CheckOutPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
