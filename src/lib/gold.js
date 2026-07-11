// Makrio Gold üyelik yardımcıları.
export const FREE_LOG_LIMIT = 3

export function isGold(profile) {
  return ['gold', 'active'].includes(profile?.subscription_status)
}
