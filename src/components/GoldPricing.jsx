// Gold fiyat bloğu — yıllık plan öne, indirim net: üstü çizili aylık toplamı
// (₺959,88) karşısında ₺599,99. Cafcaf ölçülü: altın rozet + ince parıltı, o kadar.
const YEARLY = '₺599,99'
const YEARLY_FULL = '₺959,88' // 12 × ₺79,99 — indirimin kanıtı
const MONTHLY = '₺79,99'

export default function GoldPricing() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* yıllık — vurgulu */}
      <div className="relative overflow-hidden rounded-xl border border-[#F5C84B]/60 bg-[#F5C84B]/10 p-3 pt-4">
        <span className="absolute -top-px left-2.5 rounded-b-md bg-gradient-to-r from-[#F8D64B] to-[#E0A93B] px-2 py-0.5 text-[9px] font-bold tracking-wide text-black">
          %37 İNDİRİM
        </span>
        {/* tek geçişlik ince parıltı */}
        <span
          className="medal-sheen pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.22) 50%, transparent 58%)',
          }}
        />
        <div className="text-[11px] font-medium text-text-muted">Yıllık</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-text">{YEARLY}</span>
        </div>
        <div className="text-[11px] tabular-nums text-text-muted">
          <span className="line-through opacity-70">{YEARLY_FULL}</span>{' '}
          <span className="font-semibold text-[#F5C84B]">≈ ₺50/ay</span>
        </div>
      </div>

      {/* aylık */}
      <div className="rounded-xl border border-border p-3 pt-4">
        <div className="text-[11px] font-medium text-text-muted">Aylık</div>
        <div className="mt-0.5 text-xl font-bold tabular-nums text-text">{MONTHLY}</div>
        <div className="text-[11px] text-text-muted">her ay yenilenir</div>
      </div>
    </div>
  )
}
