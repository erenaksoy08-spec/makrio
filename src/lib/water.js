export const GLASS_ML = 250
export const BOTTLE_ML = 1000

// Su hedefi: son kilo × 0.035 L (kg × 35 ml), 50 ml'ye yuvarlanır.
export function computeWaterGoal(weightKg) {
  if (!weightKg || weightKg <= 0) return null
  return Math.round((weightKg * 35) / 50) * 50
}

// Günlük güvenli üst sınır (ml) — kilo aralığına göre.
// Aşılınca kullanıcı aşırı su tüketimine karşı uyarılır.
export function waterLimit(weightKg) {
  if (!weightKg || weightKg <= 0) return null
  if (weightKg <= 44) return 3000
  if (weightKg <= 55) return 3500
  if (weightKg <= 65) return 4000
  if (weightKg <= 75) return 4800
  if (weightKg <= 85) return 5500
  if (weightKg <= 95) return 6000
  return 6500
}
