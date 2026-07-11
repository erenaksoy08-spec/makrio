import { useAuth } from '../contexts/AuthContext'

// Blok Diyarı teması aktif mi?
export default function useBlokTheme() {
  const { profile } = useAuth()
  return profile?.preferences?.theme === 'blok'
}
