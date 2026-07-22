import en from './translations/en'

// Basit i18n: kaynak dili Türkçe, sözlük TR metinle anahtarlanır (gettext tarzı).
// Çevirisi olmayan metin Türkçe düşer — eksik çeviri uygulamayı asla kırmaz.
// Dil değişimi sayfa yenilemesiyle uygulanır (Settings), bu yüzden modül
// değişkeni yeterli; render sırasında dil değişmez.

const STORAGE_KEY = 'makrio-lang'
const SUPPORTED = ['tr', 'en']

let current = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return SUPPORTED.includes(saved) ? saved : 'tr'
  } catch {
    return 'tr'
  }
})()

if (typeof document !== 'undefined') document.documentElement.lang = current

export function getLocale() {
  return current
}

// Intl.* çağrıları için BCP 47 etiketi.
export function getIntlLocale() {
  return current === 'en' ? 'en-US' : 'tr-TR'
}

// Profilden gelen dili uygula (başka cihazda seçilmiş olabilir).
export function setLocale(lang) {
  if (!SUPPORTED.includes(lang) || lang === current) return false
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* özel modda localStorage olmayabilir */
  }
  document.documentElement.lang = lang
  return true
}

export function t(text, vars) {
  let out = current === 'tr' ? text : (en[text] ?? text)
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

// Bağlamlı çeviri (gettext pgettext gibi): aynı Türkçe metnin iki farklı
// İngilizce karşılığı olduğunda ayrıştırır. Türkçe her zaman metnin kendisini
// gösterir; İngilizce önce "ctxmetin" anahtarına, yoksa düz metne bakar.
export function tc(context, text, vars) {
  let out = current === 'tr' ? text : (en[`${context}${text}`] ?? en[text] ?? text)
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}
