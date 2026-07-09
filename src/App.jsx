import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingGate from './components/OnboardingGate'
import AppLayout from './components/AppLayout'
import Login from './routes/Login'
import Register from './routes/Register'
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
import LegalPage from './routes/LegalPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Register />} />
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
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
