import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Sheet from './Sheet'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getGoldPackages, purchaseGold, restoreGold, purchasesAvailable } from '../lib/purchases'

const PERKS = [
  'Sınırsız yemek kaydı',
  'Detaylı haftalık & aylık raporlar',
  "Arkadaş Ligi'ne erişim",
  'Uygulama Tasarım Mağazası',
  'Reklamsız deneyim',
]

// Hangi kapıdan gelindiyse ona özel başlık — jenerik satış dili yerine
// kullanıcının o an istediği şeyin adı.
const FEATURE_TEXTS = {
  limit: { title: 'Sınırsız kayıt için Gold', sub: 'Günde 3 ücretsiz kayıt doldu — Gold ile takibin hiç durmaz.' },
  league: { title: "Arkadaş Ligi Gold'a özel", sub: 'Arkadaşlarınla yarışmak ve panoya girmek için Gold gerekiyor.' },
  store: { title: "Tasarım Mağazası Gold'a özel", sub: 'Temaları ve tasarımları açmak için Gold gerekiyor.' },
}

// Mağaza ürünleri (App Store Connect / Play Console + RevenueCat) kurulana
// kadar paywall'ın tasarımını taşıyan yer tutucu planlar. Gerçek paketler
// ($rc_annual / $rc_monthly) gelince otomatik devre dışı kalır.
const PLACEHOLDER_PLANS = [
  { identifier: 'annual', placeholder: true, title: 'Yıllık', priceString: '₺599,99', per: '≈ ₺50/ay', badge: '%37 TASARRUF' },
  { identifier: 'monthly', placeholder: true, title: 'Aylık', priceString: '₺79,99', per: null },
]

// RC paketini karta çevir: yıllıkta rozet + ay başına eşdeğer fiyat.
function toPlan(pkg) {
  const annual = pkg.packageType === 'ANNUAL' || pkg.identifier === '$rc_annual'
  const price = pkg.product?.price
  const currency = pkg.product?.currencyCode ?? 'TRY'
  const per =
    annual && price
      ? `≈ ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price / 12)}/ay`
      : null
  return {
    identifier: pkg.identifier,
    pkg,
    title: annual ? 'Yıllık' : pkg.packageType === 'MONTHLY' || pkg.identifier === '$rc_monthly' ? 'Aylık' : pkg.product?.title,
    priceString: pkg.product?.priceString,
    per,
    badge: annual ? '%37 TASARRUF' : null,
    annual,
  }
}

export default function Paywall({ open, onClose, feature }) {
  const { user, refreshProfile } = useAuth()
  const [plans, setPlans] = useState(null) // null = yükleniyor
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const ctx = FEATURE_TEXTS[feature]

  useEffect(() => {
    if (!open) return
    setError('')
    setDone(false)
    setPlans(null)
    getGoldPackages()
      .then((pkgs) => {
        // Yıllık önce ve varsayılan seçili — en iyi değer öne.
        const mapped = pkgs.map(toPlan).sort((a, b) => (b.annual ? 1 : 0) - (a.annual ? 1 : 0))
        const list = mapped.length > 0 ? mapped : PLACEHOLDER_PLANS
        setPlans(list)
        setSelected(list[0])
      })
      .catch(() => {
        setPlans(PLACEHOLDER_PLANS)
        setSelected(PLACEHOLDER_PLANS[0])
      })
  }, [open])

  // Satın alma/geri yükleme başarılıysa: profile senkronla (tüm Gold kapıları açılır).
  // NOT: Üretimde asıl güncelleme RevenueCat webhook'u ile sunucudan yapılmalı.
  async function markGold() {
    await supabase.from('profiles').update({ subscription_status: 'gold' }).eq('id', user.id)
    await refreshProfile()
    setDone(true)
  }

  async function handleBuy() {
    if (!selected || selected.placeholder) return
    setBusy(true)
    setError('')
    try {
      if (await purchaseGold(selected.pkg)) await markGold()
    } catch {
      setError('Satın alma tamamlanamadı — tekrar dene.')
    }
    setBusy(false)
  }

  async function handleRestore() {
    setBusy(true)
    setError('')
    try {
      if (await restoreGold()) await markGold()
      else setError('Geri yüklenecek satın alma bulunamadı.')
    } catch {
      setError('Geri yükleme başarısız — tekrar dene.')
    }
    setBusy(false)
  }

  const placeholderMode = plans?.every((p) => p.placeholder)

  return (
    <Sheet open={open} onClose={onClose} title="Makrio Gold">
      {done ? (
        <div className="py-6 text-center">
          <div className="text-4xl">👑</div>
          <p className="mt-3 text-lg font-bold text-[#F5C84B]">Gold aktif!</p>
          <p className="mt-1 text-sm text-text-muted">Tüm ayrıcalıkların açıldı. Afiyet olsun.</p>
          <button
            type="button"
            onClick={onClose}
            className="btn-chip mt-5 w-full rounded-xl border border-border py-3 font-medium text-text"
          >
            Devam et
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-1">
          {/* bağlamsal başlık — hangi kapıdan gelindiyse onun dili */}
          {ctx && (
            <div className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/[0.07] px-4 py-3">
              <div className="text-sm font-semibold text-[#F5C84B]">{ctx.title}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-text-muted">{ctx.sub}</div>
            </div>
          )}

          {/* değer önerisi */}
          <ul className="space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-text">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5C84B]/15 text-[10px] text-[#F5C84B]">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>

          {/* planlar — yıllık vurgulu ve varsayılan */}
          {plans == null ? (
            <div className="rounded-2xl border border-border py-6 text-center text-sm text-text-muted">
              Planlar yükleniyor…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {plans.map((plan) => {
                const active = selected?.identifier === plan.identifier
                return (
                  <button
                    key={plan.identifier}
                    type="button"
                    onClick={() => setSelected(plan)}
                    className={`btn-chip relative rounded-2xl border p-4 pt-5 text-left ${
                      active ? 'border-[#F5C84B]/70 bg-[#F5C84B]/10' : 'border-border'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-3 rounded-full bg-gradient-to-r from-[#F8D64B] to-[#E0A93B] px-2 py-0.5 text-[9px] font-bold tracking-wide text-black">
                        {plan.badge}
                      </span>
                    )}
                    <div className="text-xs font-medium text-text-muted">{plan.title}</div>
                    <div className="mt-1 text-lg font-bold tabular-nums text-text">{plan.priceString}</div>
                    <div className="text-[11px] tabular-nums text-text-muted">
                      {plan.per ?? (plan.title === 'Aylık' ? 'her ay yenilenir' : '')}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={busy || !selected || placeholderMode}
            onClick={handleBuy}
            className="btn-primary w-full rounded-2xl bg-gradient-to-r from-[#F5C84B] to-[#E0A93B] py-3.5 font-semibold text-black disabled:opacity-40"
          >
            {busy ? 'İşleniyor…' : "Gold'a Yükselt"}
          </motion.button>

          {placeholderMode && (
            <p className="text-center text-xs text-text-muted">🚀 Satın alma çok yakında aktifleşecek.</p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={handleRestore}
            className="btn-chip w-full py-2 text-center text-xs font-medium text-text-muted disabled:opacity-40"
          >
            Satın almaları geri yükle
          </button>

          {!purchasesAvailable() && (
            <p className="text-center text-xs text-text-muted">Satın alma iOS/Android uygulamasında yapılır.</p>
          )}
        </div>
      )}
    </Sheet>
  )
}
