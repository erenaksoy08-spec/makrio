import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { purchasesAvailable } from '../lib/purchases'
import Paywall from '../components/Paywall'
import GoldPricing from '../components/GoldPricing'

const GOAL_LABELS = { lose: 'Kilo verme', gain: 'Kilo alma', maintain: 'Formu koruma' }
const GENDER_LABELS = { female: 'Kadın', male: 'Erkek' }

// Hedef kartı kimlikleri — hedefe göre renk, ikon ve motto.
const GOAL_META = {
  lose: { icon: '📉', accent: '#57C97E', desc: 'Kalori açığıyla hafifle, formuna kavuş.' },
  gain: { icon: '📈', accent: '#FF8A5B', desc: 'Fazla kaloriyle güçlen, kütle kazan.' },
  maintain: { icon: '⚖️', accent: '#4FC3F7', desc: 'Dengeni koru, rutinini sürdür.' },
}

const GOLD_PERKS = [
  { icon: '∞', text: 'Sınırsız yemek kaydı' },
  { icon: '📊', text: 'Detaylı haftalık & aylık raporlar' },
  { icon: '🏆', text: 'Arkadaş Ligi\'ne erişim' },
  { icon: '🎁', text: 'Özel ilerleme ödülleri' },
  { icon: '🛍️', text: 'Uygulama Tasarım Mağazası\'na erişim' },
  { icon: '🚫', text: 'Reklamsız deneyim' },
]

function GoldCard({ isGold }) {
  const [info, setInfo] = useState(false)
  // Native'de gerçek satın alma ekranı; web'de "yakında" bilgisi.
  const [paywall, setPaywall] = useState(false)
  // Perk listesi istek üzerine açılır — kart her profil ziyaretinde tam boy bağırmasın.
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#E8B84B]/40 bg-gradient-to-br from-[#3a2e12] via-surface to-surface p-5">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, #F5C84B, transparent 70%)' }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(245,200,75,0.6))' }}>
            👑
          </span>
          <span className="bg-gradient-to-r from-[#F8D64B] to-[#E0A93B] bg-clip-text text-lg font-bold text-transparent">
            Makrio Gold
          </span>
          {isGold && (
            <span className="ml-auto rounded-full bg-[#F5C84B]/20 px-2.5 py-0.5 text-xs font-semibold text-[#F5C84B]">
              Aktif ✓
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-text-muted">Potansiyelini sonuna kadar kullan.</p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#F5C84B]"
        >
          Neler dahil?
          <span className={`inline-block transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {expanded && (
          <ul className="mt-3 space-y-2">
            {GOLD_PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-2.5 text-sm text-text">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C84B]/15 text-xs text-[#F5C84B]">
                  {p.icon}
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        )}

        {!isGold && (
          <>
            <div className="mt-4">
              <GoldPricing />
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => (purchasesAvailable() ? setPaywall(true) : setInfo(true))}
              className="btn-primary mt-3 w-full rounded-xl bg-gradient-to-r from-[#F5C84B] to-[#E0A93B] py-3 font-semibold text-black"
            >
              Gold'a Yükselt
            </motion.button>
            <Paywall open={paywall} onClose={() => setPaywall(false)} />
            {info && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-xs text-[#F5C84B]"
              >
                🚀 Ödeme altyapısı çok yakında aktifleşecek!
              </motion.p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const streak = profile?.current_streak ?? 0
  const longest = profile?.longest_streak ?? 0
  const isGold = ['gold', 'active'].includes(profile?.subscription_status)
  const initial = (profile?.name || user.email || '?').trim().charAt(0).toUpperCase()

  // Kilo, onboarding'de kalan değer yerine son tartı kaydını gösterir.
  const [latestWeight, setLatestWeight] = useState(null)
  useEffect(() => {
    supabase
      .from('weight_logs')
      .select('kg')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .then(({ data }) => setLatestWeight(data?.[0]?.kg ?? null))
  }, [user.id])

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold text-text">Profil</h1>

      {/* account */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">
          {initial}
        </div>
        <div className="min-w-0">
          {profile?.name && <div className="truncate font-medium text-text">{profile.name}</div>}
          <div className="truncate text-sm text-text-muted">{user.email}</div>
        </div>
      </div>

      {/* gold */}
      <GoldCard isGold={isGold} />

      {/* streak stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-surface p-4">
          <div className="text-2xl font-bold tabular-nums text-text">🔥 {streak}</div>
          <div className="text-xs text-text-muted">Güncel seri</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface p-4">
          <div className="text-2xl font-bold tabular-nums text-text">🏆 {longest}</div>
          <div className="text-xs text-text-muted">En uzun seri</div>
        </div>
      </div>

      {/* goal summary — hedefe göre renklenen premium kart */}
      {profile?.goal &&
        (() => {
          const meta = GOAL_META[profile.goal] ?? { icon: '🎯', accent: '#4FC3F7', desc: '' }
          const a = meta.accent
          const targetWeight = profile?.preferences?.targetWeight
          const stats = [
            (latestWeight ?? profile.weight_kg) && { value: latestWeight ?? profile.weight_kg, unit: 'kg', label: 'Kilo' },
            profile.height_cm && { value: profile.height_cm, unit: 'cm', label: 'Boy' },
            profile.age && { value: profile.age, unit: '', label: 'Yaş' },
            profile.gender && { value: GENDER_LABELS[profile.gender] ?? profile.gender, unit: '', label: 'Cinsiyet' },
          ].filter(Boolean)

          return (
            <div
              className="relative overflow-hidden rounded-3xl border p-5"
              style={{
                borderColor: `${a}33`,
                background: `radial-gradient(120% 100% at 0% 0%, ${a}16, var(--color-surface) 72%)`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* köşe ışıması */}
              <div
                className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-40 blur-2xl"
                style={{ background: `radial-gradient(circle, ${a}, transparent 70%)` }}
              />

              <div className="relative flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    backgroundColor: `${a}1c`,
                    border: `1px solid ${a}40`,
                    boxShadow: `0 0 14px ${a}30`,
                  }}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Hedefin</div>
                  <div className="text-lg font-bold tracking-tight text-text">
                    {GOAL_LABELS[profile.goal] ?? profile.goal}
                  </div>
                  <div className="truncate text-xs text-text-muted">{meta.desc}</div>
                </div>
                {targetWeight && (
                  <span
                    className="ml-auto shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums"
                    style={{ borderColor: `${a}40`, backgroundColor: `${a}14`, color: a }}
                  >
                    🎯 {targetWeight} kg
                  </span>
                )}
              </div>

              {/* iç içe kart yerine tek şerit + ince ayraçlar */}
              <div className="relative mt-4 grid grid-cols-4 divide-x divide-white/[0.07] border-t border-white/[0.07] pt-3">
                {stats.map((s) => (
                  <div key={s.label} className="px-1 text-center">
                    <div className="text-sm font-semibold tabular-nums text-text">
                      {s.value}
                      {s.unit && <span className="text-[10px] font-medium text-text-muted"> {s.unit}</span>}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

      {/* progress link */}
      <Link
        to="/ilerleme"
        className="btn-row flex items-center justify-between rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 to-transparent p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-lg">⭐</span>
          <div>
            <div className="text-sm font-medium text-text">İlerleme & Ödüller</div>
            <div className="text-xs text-text-muted">Serini sürdür, ödülleri aç</div>
          </div>
        </div>
        <span className="text-text-muted">›</span>
      </Link>

      {/* settings */}
      <Link
        to="/ayarlar"
        className="btn-row flex items-center justify-between rounded-2xl border border-white/5 bg-surface p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <div className="text-sm font-medium text-text">Ayarlar</div>
            <div className="text-xs text-text-muted">Veri sıfırlama ve hesap</div>
          </div>
        </div>
        <span className="text-text-muted">›</span>
      </Link>

      <button
        type="button"
        onClick={signOut}
        className="btn-chip w-full rounded-2xl border border-border px-3 py-3 font-medium text-red-400"
      >
        Çıkış yap
      </button>
    </div>
  )
}
