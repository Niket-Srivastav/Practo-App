import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DoctorSearchPage from './pages/DoctorSearchPage'
import BookingPage from './pages/BookingPage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import DoctorDashboard from './pages/DoctorDashboard'
import AppointmentStatusPage from './pages/AppointmentStatusPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f2044',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#06b6d4', secondary: '#060b18' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#060b18' },
            },
          }}
        />

        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/doctors" element={<DoctorSearchPage />} />

          {/* Patient-protected routes */}
          <Route
            path="/book/:doctorId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <MyAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments/:appointmentId/status"
            element={
              <ProtectedRoute>
                <AppointmentStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Doctor-protected route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="DOCTOR">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
