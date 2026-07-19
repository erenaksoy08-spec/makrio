import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { initPurchases, hasGoldEntitlement, purchasesAvailable } from '../lib/purchases'
import { setLocale } from '../lib/i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      // Başka cihazda seçilmiş dil bu cihaza taşınsın; ilk yüklemede
      // sözlük değişti diye tüm ekranı tazelemek için reload gerekir.
      if (data.preferences?.language && setLocale(data.preferences.language)) window.location.reload()
      setProfile(data)
    } else if (!error || error.code === 'PGRST116') {
      // Satır gerçekten yok (yeni kullanıcı) — onboarding'e gitmesi doğru.
      setProfile(null)
    }
    // Diğer hatalarda (ağ kopması, geçici 5xx) eldeki profili koru:
    // aksi halde onboarded kullanıcı yanlışlıkla /onboarding'e düşer.
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session?.user) fetchProfile(data.session.user.id)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [fetchProfile])

  // Native (iOS/Android): girişte RevenueCat'i başlat ve aktif aboneliği
  // profile senkronla — cihaz değişiminde/yeniden kurulumda Gold kaybolmasın.
  // NOT: Üretimde asıl senkron RevenueCat webhook'u ile sunucudan yapılmalı;
  // bu istemci senkronu hesaplar kurulana kadarki köprü.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId || !purchasesAvailable()) return
    initPurchases(userId)
      .then(() => hasGoldEntitlement())
      .then(async (active) => {
        if (active) {
          await supabase.from('profiles').update({ subscription_status: 'gold' }).eq('id', userId)
          fetchProfile(userId)
        }
      })
      .catch(() => {}) // anahtar yoksa/ağ hatasında sessiz geç — web akışı etkilenmez
  }, [userId, fetchProfile])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    profile,
    profileLoading,
    refreshProfile: (uid) => fetchProfile(uid ?? session?.user?.id),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı')
  return ctx
}
