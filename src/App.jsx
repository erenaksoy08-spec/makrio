import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingGate from './components/OnboardingGate'
import AppLayout from './components/AppLayout'
import Login from './routes/Login'
import ResetPassword from './routes/ResetPassword'
import Onboarding from './routes/Onboarding'
import Dashboard from './routes/Dashboard'
import DailyLog from './routes/DailyLog'
import History from './routes/History'
import Profile from './routes/Profile'
import Progress from './routes/Progress'
import League from './routes/League'
import Store from './routes/Store'
import Hall from './routes/Hall'
import Quests from './routes/Quests'
import Inventory from './routes/Inventory'
import LegalPage from './routes/LegalPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Sistem "hareketi azalt" tercihinde framer animasyonları otomatik kısılır */}
        <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/giris" element={<Login />} />
          {/* Tek kayıt yolu: soruların önde olduğu onboarding akışı */}
          <Route path="/kayit" element={<Navigate to="/hosgeldin" replace />} />
          <Route path="/hosgeldin" element={<Onboarding />} />
          <Route path="/sifre-sifirla" element={<ResetPassword />} />
          <Route path="/yasal/:slug" element={<LegalPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<OnboardingGate />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gunluk" element={<DailyLog />} />
                <Route path="/gecmis" element={<History />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/ilerleme" element={<Progress />} />
                <Route path="/lig" element={<League />} />
                <Route path="/vitrin" element={<Store />} />
                <Route path="/salon" element={<Hall />} />
                <Route path="/gorevler" element={<Quests />} />
                <Route path="/envanter" element={<Inventory />} />
              </Route>
            </Route>
          </Route>
        </Routes>
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  )
}
