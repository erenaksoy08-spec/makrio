import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  // Oturumu olmayan ziyaretçi doğrudan soru akışına (hesapsız onboarding) gider.
  if (!user) return <Navigate to="/hosgeldin" replace />

  return <Outlet />
}
