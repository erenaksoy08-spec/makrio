import { t } from './i18n'

// Görevler — Plaka kazanma motoru.
// Durum preferences.quests içinde tutulur:
//   daily: { date, periods: [], collected: { streak, periods } }  → her gün sıfırlanır
//   done:  { 'streak-5': true, 'hall-claim': 3, 'friend-each': 2, ... }
// İlerleme mevcut profil verisinden türetilir (peak streak, claimedRewards,
// arkadaş sayısı, Gold durumu) — ekstra tablo gerekmez.

// Bir kerelik seri başarımları: [gün, plaka] — sıra kullanıcı specine birebir.
export const STREAK_MILESTONES = [
  [5, 5],
  [21, 10],
  [30, 15],
  [45, 20],
  [60, 25],
  [90, 30],
  [120, 40],
  [150, 50],
  [180, 65],
  [250, 80],
  [280, 35],
  [300, 90],
  [330, 40],
  [365, 150],
  [400, 90],
  [450, 100],
  [500, 500],
]

export const DAILY_REWARDS = { streak: 1, periods: 2 }
export const REPEAT_REWARDS = { hallClaim: 5, friendEach: 3, friendBonus10: 15 }

export function questState(preferences, today) {
  const q = preferences?.quests ?? {}
  const daily =
    q.daily?.date === today ? q.daily : { date: today, periods: [], collected: {} }
  return { daily, done: q.done ?? {} }
}

// Bir kerelik görevlerin (başarımların) durum listesi.
// friendsCount null ise arkadaş görevleri 'unknown' sayılır (kart rozetine girmez).
export function buildMilestones({ profile, today, friendsCount = null }) {
  const prefs = profile?.preferences ?? {}
  const { done } = questState(prefs, today)
  const peak = Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0)
  const claimed = prefs.claimedRewards ?? []
  const isGold = ['gold', 'active'].includes(profile?.subscription_status)

  const list = []

  list.push({
    id: 'gold-welcome',
    icon: '👑',
    title: t("Makrio Gold'a Hoş Geldin"),
    sub: t('Gold üyeliğe geç, hediyeni kap'),
    reward: 5,
    progress: isGold ? 1 : 0,
    target: 1,
    ready: isGold && !done['gold-welcome'],
    collected: !!done['gold-welcome'],
  })

  list.push({
    id: 'first-friend',
    icon: '🤝',
    title: t('İlk Arkadaş'),
    sub: t("Arkadaş Ligi'ne ilk arkadaşını ekle"),
    reward: 10,
    progress: friendsCount == null ? null : Math.min(1, friendsCount),
    target: 1,
    ready: friendsCount != null && friendsCount >= 1 && !done['first-friend'],
    collected: !!done['first-friend'],
  })

  for (const [days, reward] of STREAK_MILESTONES) {
    list.push({
      id: `streak-${days}`,
      icon: '🔥',
      title: t('{n} Günlük Seri', { n: days }),
      sub: t('{n} gün üst üste kayıt tut', { n: days }),
      reward,
      progress: Math.min(days, peak),
      target: days,
      ready: peak >= days && !done[`streak-${days}`],
      collected: !!done[`streak-${days}`],
    })
  }

  list.push({
    id: 'bronze-claim',
    icon: '🥉',
    title: t('Bronz Rozet'),
    sub: t("Şeref Salonu'ndan bronz rozeti al"),
    reward: 25,
    progress: claimed.includes('bronze-badge') ? 1 : 0,
    target: 1,
    ready: claimed.includes('bronze-badge') && !done['bronze-claim'],
    collected: !!done['bronze-claim'],
  })

  return list
}

// Günlük görevler (her gün yenilenir).
export function buildDaily({ profile, today }) {
  const prefs = profile?.preferences ?? {}
  const { daily } = questState(prefs, today)
  const streakDoneToday = profile?.last_log_date === today
  const seen = daily.periods ?? []

  return [
    {
      id: 'daily-streak',
      icon: '⚡',
      title: t('Seriyi Uzat'),
      sub: t('Bugünün ilk kaydını at (+1 seri)'),
      reward: DAILY_REWARDS.streak,
      progress: streakDoneToday ? 1 : 0,
      target: 1,
      ready: streakDoneToday && !daily.collected?.streak,
      collected: !!daily.collected?.streak,
    },
    {
      id: 'daily-periods',
      icon: '🌗',
      title: t('Dört Vakit'),
      sub: t('Sabah, öğle, akşam ve gece uygulamaya uğra'),
      reward: DAILY_REWARDS.periods,
      progress: Math.min(4, seen.length),
      target: 4,
      ready: seen.length >= 4 && !daily.collected?.periods,
      collected: !!daily.collected?.periods,
    },
  ]
}

// Tekrarlanan görevler (tamamlanınca yenilenir) — kaç kez toplanabilir?
export function buildRepeatables({ profile, today, friendsCount = null }) {
  const prefs = profile?.preferences ?? {}
  const { done } = questState(prefs, today)
  const claimedCount = (prefs.claimedRewards ?? []).length

  const hallCollected = done['hall-claim'] ?? 0
  const friendCollected = done['friend-each'] ?? 0
  const bonusCollected = done['friend-bonus10'] ?? 0

  return [
    {
      id: 'hall-claim',
      icon: '🎖️',
      title: t('Madalyon Avcısı'),
      sub: t("Şeref Salonu'ndan bir ödül aç"),
      reward: REPEAT_REWARDS.hallClaim,
      available: Math.max(0, claimedCount - hallCollected),
      collectedCount: hallCollected,
    },
    {
      id: 'friend-each',
      icon: '🤝',
      title: t('Takım Büyüyor'),
      sub: t("Arkadaş Ligi'ne eklenen her arkadaş için"),
      reward: REPEAT_REWARDS.friendEach,
      available: friendsCount == null ? null : Math.max(0, friendsCount - friendCollected),
      collectedCount: friendCollected,
    },
    {
      id: 'friend-bonus10',
      icon: '🎁',
      title: t('Onluk Kadro'),
      sub: t('Her 10 arkadaş için ekstra bonus'),
      reward: REPEAT_REWARDS.friendBonus10,
      available: friendsCount == null ? null : Math.max(0, Math.floor(friendsCount / 10) - bonusCollected),
      collectedCount: bonusCollected,
    },
  ]
}

// İlerleme sayfası rozeti: arkadaş verisi gerektirmeyen hazır görev sayısı.
export function readyQuestCount(profile, today) {
  const milestones = buildMilestones({ profile, today, friendsCount: null })
  const daily = buildDaily({ profile, today })
  const repeat = buildRepeatables({ profile, today, friendsCount: null })
  return (
    milestones.filter((m) => m.ready && m.id !== 'first-friend').length +
    daily.filter((d) => d.ready).length +
    repeat.reduce((s, r) => s + (r.available ?? 0), 0)
  )
}
