// Besin Karnesi — 5'lik küsuratlı puan (3.2/5 gibi).
// İki katman birlikte çalışır:
//  1) Makro profili: protein yoğunluğu, enerji yoğunluğu, yağ/karb ağırlığı, lif.
//  2) Besin sınıfı: isimden tanınan gıda tipine göre mikro besin düzeltmesi —
//     zeytinyağı/yağlı tohumlar (doymamış yağ, E vit.), yağlı balık (omega-3),
//     yumurta (kolin, B12, D), baklagil (demir, lif), tam tahıl (B vit.),
//     işlenmiş et (sodyum, nitrit), kızartma, margarin.
// Salt makro bakışı zeytinyağını "kötü", döneri "mükemmel" sanır; sınıf katmanı
// bunu düzeltir. Aynı besin her zaman aynı puanı alır. Tavan 4.8 — hiçbir yemek
// mükemmel değildir.

const BANDS = [
  { min: 4.0, color: '#6FCF97', verdict: 'Çok iyi' },
  { min: 3.0, color: '#C9D048', verdict: 'İyi' },
  { min: 2.0, color: '#F2A94C', verdict: 'Orta' },
  { min: 0, color: '#F26B6B', verdict: 'Zayıf' },
]

const MAX_SCORE = 4.8

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

// Türkçe katlama — DB'deki name_search ile aynı mantık.
function fold(s) {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

// Besin sınıfları — isim eşleşmesi + makro ön koşulu (fındıklı çikolata kreması
// "fındık" diye sağlıklı sayılmasın diye guard'lar var).
const FOOD_CLASSES = [
  {
    id: 'healthyOil',
    match: ['zeytinyag', 'avokado yag', 'keten tohumu yag', 'balik yagi'],
    guard: (m) => m.fatPct > 0.85 && m.c < 5,
    floor: 4.0,
    tag: 'Sağlıklı yağ',
    reason: { text: 'Doymamış (sağlıklı) yağ kaynağı — ölçülü porsiyonla değerli', good: true },
    dropFatPenalty: true,
  },
  {
    id: 'nutsSeeds',
    match: ['findik', 'ceviz', 'badem', 'antep fistigi', 'yer fistigi', 'fistik ezmesi', 'kabak cekirdegi', 'ay cekirdegi', 'chia', 'keten tohumu', 'susam', 'tahin', 'avokado', 'zeytin'],
    exclude: ['zeytinyag', 'hindistan'],
    guard: (m) => m.fatPct > 0.5 && m.c < 25,
    floor: 3.6,
    tag: 'Besleyici yağlı tohum',
    reason: { text: 'Sağlıklı yağ, E vitamini ve mineral kaynağı', good: true },
    dropFatPenalty: true,
  },
  {
    id: 'oilyFish',
    match: ['somon', 'hamsi', 'sardalya', 'uskumru', 'alabalik', 'ton balik', 'ton balig', 'palamut'],
    guard: (m) => m.p >= 10,
    bonus: 0.4,
    tag: 'Omega-3 kaynağı',
    reason: { text: 'Omega-3 yağ asitleri ve D vitamini kaynağı', good: true },
  },
  {
    id: 'egg',
    match: ['yumurta'],
    guard: (m) => m.p >= 6,
    bonus: 0.6,
    tag: 'Besin yoğun',
    reason: { text: 'Tam protein + kolin, D ve B12 vitamini', good: true },
  },
  {
    id: 'legume',
    match: ['mercimek', 'nohut', 'fasulye', 'barbunya', 'bakla', 'bezelye', 'soya'],
    bonus: 0.4,
    tag: 'Bitkisel protein',
    reason: { text: 'Bitkisel protein, lif, demir ve folat kaynağı', good: true },
  },
  {
    id: 'wholegrain',
    match: ['bulgur', 'yulaf', 'tam bugday', 'tam tahil', 'esmer pirinc', 'kinoa', 'karabugday', 'cavdar'],
    guard: (m) => m.kcal < 450 && m.fatPct < 0.45,
    bonus: 0.3,
    tag: 'Tam tahıl',
    reason: { text: 'Tam tahıl — B vitaminleri, magnezyum ve lif', good: true },
  },
  {
    id: 'processedMeat',
    match: ['doner', 'salam', 'sosis', 'sucuk', 'nugget', 'jambon', 'pastirma'],
    exclude: ['salamura'],
    penalty: 0.8,
    cap: 3.3,
    tag: 'İşlenmiş et',
    reason: { text: 'İşlenmiş et — yüksek sodyum, doymuş yağ ve katkı payı', good: false },
  },
  {
    id: 'fried',
    match: ['kizartma', 'kizarmis', 'cips', 'citir '],
    penalty: 0.6,
    cap: 3.0,
    tag: 'Kızartma',
    reason: { text: 'Kızartma / aşırı işlenmiş — yağ kalitesi düşük', good: false },
  },
  {
    id: 'margarine',
    match: ['margarin'],
    penalty: 0.5,
    cap: 1.5,
    tag: 'Endüstriyel yağ',
    reason: { text: 'Endüstriyel margarin — doymuş/işlenmiş yağ', good: false },
  },
]

export function scoreFood(food) {
  const kcal = Number(food?.calories_per_100g) || 0
  const p = Number(food?.protein_per_100g) || 0
  const c = Number(food?.carbs_per_100g) || 0
  const f = Number(food?.fat_per_100g) || 0
  const fiber = Number(food?.fiber_per_100g) || 0
  const name = food?.name_search || fold(food?.name_tr)

  // Kalorisiz içecekler (su, sade soda...) — makro yok, karne nötr-iyi.
  if (kcal < 5 && p + c + f < 1) {
    return {
      score: 4.0,
      display: '4.0',
      color: BANDS[0].color,
      verdict: BANDS[0].verdict,
      tags: ['Kalorisiz'],
      reasons: [{ text: 'Kalori içermez — hedefini etkilemez', good: true }],
    }
  }

  const safeKcal = Math.max(kcal, 1)
  const m = {
    kcal, p, c, f, fiber,
    proteinPct: (p * 4) / safeKcal,
    carbPct: (c * 4) / safeKcal,
    fatPct: (f * 9) / safeKcal,
    // Protein yoğunluğu: 100 kcal başına gram protein — doyuruculuğun en iyi vekili.
    pDensity: p / (safeKcal / 100),
  }

  const classes = FOOD_CLASSES.filter(
    (cl) =>
      cl.match.some((kw) => name.includes(kw)) &&
      !(cl.exclude || []).some((kw) => name.includes(kw)) &&
      (!cl.guard || cl.guard(m)),
  )
  const has = (id) => classes.some((cl) => cl.id === id)
  const dropFatPenalty = classes.some((cl) => cl.dropFatPenalty)

  const reasons = []
  let score = 2.5

  // 1) Protein — 12 g/100kcal ve üzeri tavan bonus alır (tavuk göğsü ~19).
  score += clamp(m.pDensity / 12, 0, 1) * 1.6
  if (m.pDensity >= 12 && kcal <= 250) score += 0.4
  if (m.pDensity >= 6)
    reasons.push({ text: `Protein yoğunluğu yüksek (100 kcal başına ${m.pDensity.toFixed(1)} g)`, good: true })
  else if (m.pDensity < 3 && kcal > 150)
    reasons.push({ text: 'Protein içeriği düşük', good: false })

  // 2) Enerji yoğunluğu — 100g başına kalori.
  if (kcal <= 150) {
    score += clamp((150 - kcal) / 150, 0, 1) * 0.5
    if (kcal < 100) reasons.push({ text: 'Enerji yoğunluğu düşük — porsiyon dostu', good: true })
  } else if (kcal > 300) {
    score -= clamp((kcal - 300) / 300, 0, 1) * 1.0
    reasons.push({ text: `Enerji yoğunluğu yüksek (${Math.round(kcal)} kcal / 100 g)`, good: false })
  }

  // 3) Yağ ağırlığı — kalorinin yarısından fazlası yağsa. Proteinli bütün
  //    gıdalar (yumurta, somon) ve sağlıklı yağ sınıfları muaf.
  if (m.fatPct > 0.55 && m.pDensity < 8 && fiber < 4 && !dropFatPenalty) {
    score -= clamp((m.fatPct - 0.55) / 0.35, 0, 1) * 0.8
    reasons.push({ text: `Kalorisinin %${Math.round(clamp(m.fatPct, 0, 1) * 100)}'i yağdan`, good: false })
  }

  // 4) Rafine karb profili — karb ağırlıklı, proteinsiz, lifsiz VE kalorisi
  //    bütün meyve/sebzeden yüksek (elma-muz bu cezaya girmez, ekmek girer).
  if (m.carbPct > 0.65 && m.pDensity < 4 && fiber < 3 && kcal >= 100 && !has('wholegrain') && !has('legume')) {
    score -= 0.6
    reasons.push({ text: 'Rafine karbonhidrat profili — düşük protein ve lif', good: false })
  }

  // 5) Şekerli içecek profili — düşük kalorili ama makrosu salt şeker olan sıvılar.
  if (kcal < 100 && p < 0.5 && f < 0.5 && c >= 8 && fiber < 1) {
    score -= 0.8
    reasons.push({ text: 'Şekerli içecek profili — sıvı şeker', good: false })
  }

  // 6) Lif bonusu.
  if (fiber >= 6) score += 0.5
  else if (fiber >= 3) score += 0.3
  if (fiber >= 3) reasons.push({ text: `Lif içeriği iyi (${fiber} g / 100 g)`, good: true })

  // 7) Düşük kalorili bütün gıda (sebze/meyve profili).
  if (kcal > 5 && kcal < 60 && (p >= 0.2 || fiber >= 1)) {
    score += 0.4
    reasons.push({ text: 'Düşük kalorili bütün gıda profili', good: true })
  }

  // 8) Besin sınıfı düzeltmeleri (mikro besin katmanı).
  for (const cl of classes) {
    if (cl.bonus) score += cl.bonus
    if (cl.penalty) score -= cl.penalty
    reasons.push(cl.reason)
  }
  for (const cl of classes) if (cl.cap) score = Math.min(score, cl.cap)
  for (const cl of classes) if (cl.floor) score = Math.max(score, cl.floor)

  score = clamp(Math.round(score * 10) / 10, 0.5, MAX_SCORE)
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]

  return {
    score,
    display: score.toFixed(1),
    color: band.color,
    verdict: band.verdict,
    tags: buildTags(m, classes),
    reasons,
  }
}

// Kısa etiketler — sınıf etiketi öncelikli, en anlamlı ilk 2 tanesi.
function buildTags(m, classes) {
  const tags = classes.map((cl) => cl.tag)
  const healthyFat = classes.some((cl) => cl.dropFatPenalty)
  if (m.pDensity >= 10) tags.push('Protein deposu')
  else if (m.pDensity >= 6) tags.push('İyi protein kaynağı')
  if (m.fiber >= 5) tags.push('Lif zengini')
  if (m.kcal >= 400) tags.push('Kalori yoğunluğu yüksek')
  else if (m.kcal > 5 && m.kcal < 60) tags.push('Düşük kalorili')
  if (m.fatPct >= 0.6 && !healthyFat) tags.push('Yağ ağırlıklı')
  if (m.carbPct >= 0.65 && m.pDensity < 4 && m.kcal >= 100) tags.push('Karbonhidrat ağırlıklı')
  if (m.kcal < 100 && m.p < 0.5 && m.f < 0.5 && m.carbPct >= 0.85 && m.fiber < 1) tags.push('Şeker ağırlıklı')
  if (
    tags.length === 0 &&
    m.proteinPct >= 0.15 &&
    m.proteinPct <= 0.5 &&
    m.carbPct <= 0.55 &&
    m.fatPct <= 0.5
  )
    tags.push('Dengeli makro dağılımı')
  if (tags.length === 0) tags.push(m.carbPct > m.fatPct ? 'Karb ağırlıklı profil' : 'Standart profil')
  return [...new Set(tags)].slice(0, 2)
}
