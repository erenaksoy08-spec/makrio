import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function isOnboarded(profile) {
  if (!profile) return false
  return Boolean(
    profile.age && profile.gender && profile.weight_kg && profile.height_cm && profile.activity_level && profile.goal,
  )
}

export default function OnboardingGate() {
  const { profile, profileLoading, loading } = useAuth()

  // Oturum veya profil henüz çözülmediyse karar verme — erken /onboarding
  // yönlendirmesi onboarded kullanıcıyı soru ekranına düşürür.
  if (!profile && (loading || profileLoading)) return null
  if (!isOnboarded(profile)) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
