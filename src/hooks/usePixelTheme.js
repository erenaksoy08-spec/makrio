import { useAuth } from '../contexts/AuthContext'

// Piksel tema (pixel / pixel-dark / pixel-color) aktif mi?
export default function usePixelTheme() {
  const { profile } = useAuth()
  return String(profile?.preferences?.theme ?? '').startsWith('pixel')
}
