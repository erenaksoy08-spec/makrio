import { useAuth } from '../contexts/AuthContext'
import { isGold } from '../lib/gold'

// Tek soru, tek cevap: "bu kullanıcı premium mu?"
// Doğruluk kaynağı profiles.subscription_status — native satın alma da
// (AuthContext'teki senkron sayesinde) aynı alana yazar, böylece uygulamadaki
// tüm Gold kapıları (kayıt limiti, Lig, Vitrin...) otomatik açılır.
export default function usePremium() {
  const { profile, profileLoading } = useAuth()
  return { premium: isGold(profile), loading: profileLoading }
}
