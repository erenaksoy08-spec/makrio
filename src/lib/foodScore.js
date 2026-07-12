// Besin Karnesi — 100g makro verisinden deterministik 5'lik puan (3.2/5 gibi).
// Nutri-Score'dan esinlenir ama makro takip uygulamasına göre uyarlanmıştır:
// protein yoğunluğu ödüllendirilir, boş kalori (yüksek enerji + düşük protein)
// cezalandırılır. Aynı besin her zaman aynı puanı alır.

const BANDS = [
  { min: 4.0, color: '#6FCF97', verdict: 'Çok iyi' },
  { min: 3.0, color: '#C9D048', verdict: 'İyi' },
  { min: 2.0, color: '#F2A94C', verdict: 'Orta' },
  { min: 0, color: '#F26B6B', verdict: 'Zayıf' },
]

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

// Puanı 0.5–5.0 aralığında, tek küsurat basamağıyla hesaplar.
export function scoreFood(food) {
  const kcal = Number(food?.calories_per_100g) || 0
  const p = Number(food?.protein_per_100g) || 0
  const c = Number(food?.carbs_per_100g) || 0
  const f = Number(food?.fat_per_100g) || 0
  const fiber = Number(food?.fiber_per_100g) || 0

  // Kalorisiz içecekler (su, sade soda...) — makro yok, karne nötr-iyi.
  if (kcal < 5 && p + c + f < 1) {
    return { score: 4.0, display: '4.0', color: BANDS[0].color, verdict: BANDS[0].verdict, tags: ['Kalorisiz'] }
  }

  const safeKcal = Math.max(kcal, 1)
  const proteinPct = (p * 4) / safeKcal
  const carbPct = (c * 4) / safeKcal
  const fatPct = (f * 9) / safeKcal
  // Protein yoğunluğu: 100 kcal başına gram protein — doyuruculuğun en iyi vekili.
  const pDensity = p / (safeKcal / 100)

  let score = 2.5

  // 1) Protein — 12 g/100kcal ve üzeri tavan bonus alır (tavuk göğsü ~19).
  score += clamp(pDensity / 12, 0, 1) * 1.6
  // Yağsız protein sinerjisi: hem yoğun protein hem makul enerji.
  if (pDensity >= 12 && kcal <= 250) score += 0.4

  // 2) Enerji yoğunluğu — 100g başına kalori.
  if (kcal <= 150) score += clamp((150 - kcal) / 150, 0, 1) * 0.5
  else if (kcal > 300) score -= clamp((kcal - 300) / 300, 0, 1) * 1.0

  // 3) Yağ ağırlığı — kalorinin yarısından fazlası yağsa. Proteinli bütün
  //    gıdalar (yumurta, somon) ve lifli yağlılar (fındık, badem) muaf.
  if (fatPct > 0.55 && pDensity < 8 && fiber < 4) score -= clamp((fatPct - 0.55) / 0.35, 0, 1) * 0.8

  // 4) Rafine karb profili — karb ağırlıklı, proteinsiz, lifsiz VE kalorisi
  //    bütün meyve/sebzeden yüksek (elma-muz bu cezaya girmez, ekmek girer).
  if (carbPct > 0.65 && pDensity < 4 && fiber < 3 && kcal >= 100) score -= 0.6

  // 5) Şekerli içecek profili — düşük kalorili ama makrosu salt şeker olan
  //    sıvılar (kola, gazoz, meyve suyu tozu...).
  if (kcal < 100 && p < 0.5 && f < 0.5 && c >= 8 && fiber < 1) score -= 0.8

  // 6) Lif bonusu.
  if (fiber >= 6) score += 0.5
  else if (fiber >= 3) score += 0.3

  // 7) Düşük kalorili bütün gıda (sebze/meyve profili) — az da olsa protein
  //    ya da lif taşır; şekerli içecekler taşımaz.
  if (kcal > 5 && kcal < 60 && (p >= 0.2 || fiber >= 1)) score += 0.4

  score = clamp(Math.round(score * 10) / 10, 0.5, 5)
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]

  return {
    score,
    display: score.toFixed(1),
    color: band.color,
    verdict: band.verdict,
    tags: buildTags({ kcal, fiber, proteinPct, carbPct, fatPct, pDensity }),
  }
}

// Kısa bilgilendirme etiketleri — en anlamlı ilk 2 tanesi.
function buildTags({ kcal, fiber, proteinPct, carbPct, fatPct, pDensity }) {
  const tags = []
  if (pDensity >= 10) tags.push('Protein deposu')
  else if (pDensity >= 6) tags.push('İyi protein kaynağı')
  if (fiber >= 5) tags.push('Lif zengini')
  if (kcal >= 400) tags.push('Kalori yoğunluğu yüksek')
  else if (kcal > 5 && kcal < 60) tags.push('Düşük kalorili')
  if (fatPct >= 0.6) tags.push('Yağ ağırlıklı')
  if (carbPct >= 0.65 && pDensity < 4 && kcal >= 100) tags.push('Karbonhidrat ağırlıklı')
  if (kcal < 100 && proteinPct * kcal < 2 && fatPct * kcal < 4.5 && carbPct >= 0.85 && fiber < 1)
    tags.push('Şeker ağırlıklı')
  if (
    tags.length === 0 &&
    proteinPct >= 0.15 &&
    proteinPct <= 0.5 &&
    carbPct <= 0.55 &&
    fatPct <= 0.5
  )
    tags.push('Dengeli makro dağılımı')
  if (tags.length === 0) tags.push(carbPct > fatPct ? 'Karb ağırlıklı profil' : 'Standart profil')
  return tags.slice(0, 2)
}
