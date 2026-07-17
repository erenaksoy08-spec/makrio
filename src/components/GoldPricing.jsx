// Gold fiyat bloğu — iki EŞİT kutu yan yana (MacroFactor tarzı). Yıllık
// avantajını rozet + üstü çizili toplam anlatır; aylık aynı boy ve ağırlıkta
// kalır, ezilmez. `dark`: GoldGate'in koyu altın paneli için renk varyantı.
const YEARLY = '₺599,99'
const YEARLY_FULL = '₺959,88' // 12 × ₺79,99 — indirimin kanıtı
const MONTHLY = '₺79,99'

export default function GoldPricing({ dark = false }) {
  const ink = dark ? '#F5F1E4' : 'var(--color-text)'
  const muted = dark ? '#B7AC93' : 'var(--color-text-muted)'
  const monthlyBorder = dark ? 'rgba(245, 241, 228, 0.28)' : 'var(--color-border)'

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* yıllık — rozetli ama aynı boy */}
      <div
        className="relative overflow-hidden rounded-xl border p-3 pt-4 text-left"
        style={{ borderColor: 'rgba(245, 200, 75, 0.6)', backgroundColor: 'rgba(245, 200, 75, 0.09)' }}
      >
        <span className="absolute -top-px left-2.5 rounded-b-md bg-gradient-to-r from-[#F8D64B] to-[#E0A93B] px-2 py-0.5 text-[9px] font-bold tracking-wide text-black">
          %37 İNDİRİM
        </span>
        <div className="text-[11px] font-medium" style={{ color: muted }}>
          Yıllık
        </div>
        <div className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: ink }}>
          {YEARLY}
        </div>
        <div className="text-[11px] tabular-nums" style={{ color: muted }}>
          <span className="line-through opacity-70">{YEARLY_FULL}</span>{' '}
          <span className="font-semibold text-[#F5C84B]">≈ ₺50/ay</span>
        </div>
      </div>

      {/* aylık — eşit ağırlık: aynı boy, aynı tipografi, görünür çerçeve */}
      <div
        className="rounded-xl border p-3 pt-4 text-left"
        style={{ borderColor: monthlyBorder, backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'transparent' }}
      >
        <div className="text-[11px] font-medium" style={{ color: muted }}>
          Aylık
        </div>
        <div className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: ink }}>
          {MONTHLY}
        </div>
        <div className="text-[11px]" style={{ color: muted }}>
          esnek — her ay yenilenir
        </div>
      </div>
    </div>
  )
}
