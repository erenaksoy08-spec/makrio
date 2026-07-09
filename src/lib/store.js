// Vitrin — uygulama içi mağaza. Para birimi: Scoop (protein tozu kepçesi).
// Bakiye preferences.scoops, sahiplik preferences.ownedItems içinde tutulur;
// takılan kozmetikler kendi tercih anahtarlarına yazılır (ringShape, bgColor, nameColor).

export const CURRENCY = 'Plaka'

export const STORE_ITEMS = [
  {
    id: 'square-ring',
    category: 'Halka',
    title: 'Kare Kalori Halkası',
    description: 'Ana sayfadaki kalori halkası yumuşak köşeli, keskin duruşlu bir kareye dönüşür.',
    price: 300,
    prefKey: 'ringShape',
    prefValue: 'square',
    accent: '#4FC3F7',
  },
  {
    id: 'bg-pack',
    category: 'Arka Plan',
    title: 'Özel Zemin Renkleri',
    description:
      'Uygulamanın zeminini özenle seçilmiş dört derin tondan biriyle boya. Temalarla birlikte kullanılamaz — bir tema aktifken temanın kendi zemini geçerlidir.',
    price: 450,
    prefKey: 'bgColor',
    variants: [
      { value: '#0E1526', label: 'Gece Mavisi' },
      { value: '#150F23', label: 'Mor Sis' },
      { value: '#0C1712', label: 'Orman' },
      { value: '#1A1109', label: 'Espresso' },
    ],
    accent: '#A78BFA',
  },
  {
    id: 'gold-name',
    category: 'Prestij',
    title: 'Altın Kullanıcı Adı',
    description: "Adın Arkadaş Ligi'nde altın parıltısıyla yazılır — sıralamada herkes görür.",
    price: 600,
    prefKey: 'nameColor',
    prefValue: 'gold',
    accent: '#F2C94C',
  },
]

export function scoopBalance(preferences) {
  return Math.max(0, Math.round(preferences?.scoops ?? 0))
}

export function ownsItem(preferences, itemId) {
  return (preferences?.ownedItems ?? []).includes(itemId)
}

// Altın isim yazısı — Lig ve Vitrin önizlemesi aynı stili kullanır.
export const GOLD_NAME_STYLE = {
  backgroundImage: 'linear-gradient(92deg, #F8D64B 10%, #E0A93B 45%, #F8E7A0 70%, #E0A93B 95%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 0 6px rgba(242,201,76,0.35))',
}
