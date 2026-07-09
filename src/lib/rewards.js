export const REWARDS = [
  {
    id: 'gym-theme',
    days: 1,
    title: 'İlk Gün Paketi',
    description:
      'İlk gün hediyen iki parça: Demir Çağı teması (eski okul demir salonu) ve Su Dostu (su içtikçe dolan gülen yüz). İstediğini aç, istersen ikisini birden.',
    type: 'theme',
    value: 'gym',
    icon: '🏋️',
    tier: 3,
    rarity: 'Hediye',
    accent: '#C0392B',
    // Aynı kutuda iki bağımsız hediye — her biri kendi tercihini açıp kapatır.
    duo: [
      {
        key: 'theme',
        value: 'gym',
        label: 'Demir Çağı',
        icon: '🏋️',
        accent: '#C0392B',
        desc: 'Old school demir salonu teması',
      },
      {
        key: 'waterStyle',
        value: 'smiley',
        label: 'Su Dostu',
        icon: '🙂',
        accent: '#29B6F6',
        desc: 'Su içtikçe dolan gülen yüz',
      },
    ],
  },
  {
    id: 'light-theme',
    days: 3,
    title: 'Aydınlık Tema',
    description: 'Uygulamayı aydınlık temada kullan.',
    type: 'theme',
    value: 'light',
    icon: '☀️',
    tier: 1,
    rarity: 'Yaygın',
    accent: '#F2C94C',
  },
  {
    id: 'realistic-water',
    days: 7,
    title: 'Gerçekçi Su Bardak Dolma Animasyonu',
    description: 'Su takibinde dalgalı, gerçekçi dolum animasyonu.',
    type: 'waterAnim',
    value: 'realistic',
    icon: '💧',
    tier: 2,
    rarity: 'Nadir',
    accent: '#3DA5FF',
  },
  {
    id: 'pixel-theme',
    days: 10,
    title: 'Piksel Tema',
    description: 'Uygulama sevimli bir 8-bit oyununa dönüşsün: piksel font, pastel renkler ve piksel beyin.',
    type: 'theme',
    value: 'pixel',
    icon: '🧠',
    tier: 2,
    rarity: 'Nadir',
    accent: '#5FA8E8',
  },
  {
    id: 'turquoise-ring',
    days: 14,
    title: 'Kalori Halkası Rengi: Parlak Turkuaz',
    description: 'Ana sayfadaki kalori halkasının rengini turkuaza çevir.',
    type: 'ringColor',
    value: '#22D3EE',
    icon: '🔵',
    tier: 3,
    rarity: 'Epik',
    accent: '#22D3EE',
  },
  {
    id: 'premium-nav',
    days: 20,
    title: 'Premium Alt Menü',
    description: 'Alt menü kuyumcu işçiliğiyle parlar: altın ışık hattı, mücevher kenarlıklı cam sekme ve süzülen parıltı.',
    type: 'navStyle',
    value: 'premium',
    icon: '👑',
    tier: 3,
    rarity: 'Epik',
    accent: '#C084FC',
  },
  {
    id: 'bronze-badge',
    days: 30,
    title: 'Bronz Rozet',
    description: 'Streak\'in yanında kalıcı bir bronz rozet kazan.',
    type: 'badge',
    value: 'bronze',
    icon: '🥉',
    tier: 4,
    rarity: 'Efsanevi',
    accent: '#E0A34E',
  },
]

export function isUnlocked(streak, days) {
  return (streak ?? 0) >= days
}

// Bir ödül bir kez açıldığında geri kilitlenmemeli: en uzun seriyi baz al.
export function unlockStreakFrom(profile) {
  return Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0)
}

export function getPreference(preferences, key, fallback) {
  return preferences && preferences[key] != null ? preferences[key] : fallback
}
