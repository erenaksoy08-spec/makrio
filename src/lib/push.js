import { supabase } from './supabase'

// VAPID public key — istemcide açık olması normaldir; özel anahtar sunucuda.
const VAPID_PUBLIC_KEY = 'BN_-LyYL95_MdaPfcUiZcra8aRwbM--Mj-00HKNdsVjfyeJyDCutZtK4dMrTwgfTVV7sT_107b1vvgce7kpXGeM'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'
}

// Bu tarayıcıda günaydın bildirimi açık mı?
export async function getPushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager?.getSubscription()
  return sub ? 'on' : 'off'
}

export async function subscribePush(userId) {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
  const j = sub.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: 'endpoint', ignoreDuplicates: true },
    )
  if (error) {
    await sub.unsubscribe()
    throw error
  }
  return 'on'
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager?.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return 'off'
}
