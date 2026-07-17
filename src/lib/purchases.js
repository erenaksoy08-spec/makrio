// RevenueCat abonelik servisi — yalnız native'de (iOS/Android) çalışır.
// Web'de her fonksiyon zararsız varsayılanlar döner; mevcut web akışı
// (profiles.subscription_status) değişmez.
//
// ── Kurulum tamamlanınca doldurulacaklar ─────────────────────────────
// 1. RevenueCat dashboard → Projects → API keys:
//    .env.local dosyasına (ve Vercel'e GEREKMEZ, yalnız native build'e):
//      VITE_REVENUECAT_IOS_KEY=appl_xxx
//      VITE_REVENUECAT_ANDROID_KEY=goog_xxx
// 2. App Store Connect / Play Console'da abonelik ürünü oluştur
//    (örn. makrio_gold_monthly) ve RevenueCat'te "gold" entitlement'ına bağla.
//    ENTITLEMENT_ID aşağıda — dashboard'daki adla birebir aynı olmalı.
// 3. Üretimde doğruluk kaynağı RevenueCat webhook → Supabase olmalı
//    (profiles.subscription_status'u sunucu günceller). Şimdilik satın alma
//    sonrası istemci senkronu var; hesaplar kurulunca webhook'a taşınacak.
// ─────────────────────────────────────────────────────────────────────
import { Capacitor } from '@capacitor/core'

export const ENTITLEMENT_ID = 'gold'

export function purchasesAvailable() {
  return Capacitor.isNativePlatform()
}

let sdk = null
async function loadSdk() {
  if (!purchasesAvailable()) return null
  if (!sdk) {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    sdk = Purchases
  }
  return sdk
}

// Girişten sonra bir kez çağrılır — RC kimliği Supabase user id ile eşlenir,
// böylece abonelik cihaz değişse de hesabı takip eder.
export async function initPurchases(userId) {
  const Purchases = await loadSdk()
  if (!Purchases) return
  const apiKey =
    Capacitor.getPlatform() === 'ios'
      ? import.meta.env.VITE_REVENUECAT_IOS_KEY
      : import.meta.env.VITE_REVENUECAT_ANDROID_KEY
  if (!apiKey) {
    console.warn('[purchases] RevenueCat API anahtarı yok — .env dosyasına ekleyin (VITE_REVENUECAT_*_KEY)')
    return
  }
  await Purchases.configure({ apiKey, appUserID: userId })
}

// Aktif "gold" entitlement var mı?
export async function hasGoldEntitlement() {
  const Purchases = await loadSdk()
  if (!Purchases) return false
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])
  } catch {
    return false
  }
}

// Paywall'da listelenecek paketler (RevenueCat "current" offering'i).
export async function getGoldPackages() {
  const Purchases = await loadSdk()
  if (!Purchases) return []
  const { current } = await Purchases.getOfferings()
  return current?.availablePackages ?? []
}

// Satın alma — başarılıysa true döner (iptal kullanıcı hatası değildir, false döner).
export async function purchaseGold(pkg) {
  const Purchases = await loadSdk()
  if (!Purchases) return false
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])
  } catch (e) {
    if (e?.userCancelled) return false
    throw e
  }
}

// "Satın almaları geri yükle" — cihaz/hesap değişiminde App Store/Play kaydını çeker.
export async function restoreGold() {
  const Purchases = await loadSdk()
  if (!Purchases) return false
  const { customerInfo } = await Purchases.restorePurchases()
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])
}
