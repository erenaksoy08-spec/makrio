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

// Abonelik satın alma ekranı (yalnız native'de anlamlı — web'de Gold kartındaki
// "yakında" mesajı gösterilmeye devam eder, bu sheet hiç açılmaz).
export default function Paywall({ open, onClose }) {
  const { user, refreshProfile } = useAuth()
  const [packages, setPackages] = useState(null) // null = yükleniyor
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setDone(false)
    setPackages(null)
    getGoldPackages()
      .then((pkgs) => {
        setPackages(pkgs)
        setSelected(pkgs[0] ?? null)
      })
      .catch(() => {
        setPackages([])
        setError('Ürünler yüklenemedi — internet bağlantını kontrol edip tekrar dene.')
      })
  }, [open])

  // Satın alma/geri yükleme başarılıysa: profile senkronla (tüm Gold kapıları açılır).
  async function markGold() {
    await supabase.from('profiles').update({ subscription_status: 'gold' }).eq('id', user.id)
    await refreshProfile()
    setDone(true)
  }

  async function handleBuy() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      if (await purchaseGold(selected)) await markGold()
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

          {/* paketler */}
          {packages == null ? (
            <div className="rounded-2xl border border-border py-6 text-center text-sm text-text-muted">
              Ürünler yükleniyor…
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-2xl border border-border py-6 text-center text-sm text-text-muted">
              {/* Mağaza ürünleri App Store Connect / Play Console + RevenueCat
                  dashboard kurulunca burada otomatik listelenecek. */}
              Abonelik seçenekleri çok yakında.
            </div>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => {
                const active = selected?.identifier === pkg.identifier
                return (
                  <button
                    key={pkg.identifier}
                    type="button"
                    onClick={() => setSelected(pkg)}
                    className={`btn-chip flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                      active ? 'border-[#F5C84B]/60 bg-[#F5C84B]/10' : 'border-border'
                    }`}
                  >
                    <span className="text-sm font-medium text-text">{pkg.product?.title ?? pkg.identifier}</span>
                    <span className="text-sm font-bold tabular-nums text-text">{pkg.product?.priceString}</span>
                  </button>
                )
              })}
            </div>
          )}

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={busy || !selected}
            onClick={handleBuy}
            className="btn-primary w-full rounded-2xl bg-gradient-to-r from-[#F5C84B] to-[#E0A93B] py-3.5 font-semibold text-black disabled:opacity-40"
          >
            {busy ? 'İşleniyor…' : "Gold'a Yükselt"}
          </motion.button>

          <button
            type="button"
            disabled={busy}
            onClick={handleRestore}
            className="btn-chip w-full py-2 text-center text-xs font-medium text-text-muted disabled:opacity-40"
          >
            Satın almaları geri yükle
          </button>

          {!purchasesAvailable() && (
            <p className="text-center text-xs text-text-muted">
              Satın alma iOS/Android uygulamasında yapılır.
            </p>
          )}
        </div>
      )}
    </Sheet>
  )
}
