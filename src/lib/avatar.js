import { supabase } from './supabase'

// Profil fotoğrafı: depolamada <user_id>/<zaman>.jpg, adresi profiles.avatar_url'de.
// Her yüklemede yeni dosya adı kullanılır — CDN önbelleği eski fotoğrafı göstermesin.

const BUCKET = 'avatars'
const SIZE = 256
const MAX_SOURCE_BYTES = 12 * 1024 * 1024

// Ortadan kare kırp + küçült. Telefon fotoğrafı 4 MB'tan ~30 KB'a iner,
// lig listesi 10 avatarla bile anında açılır.
export function squareJpeg(file, size = SIZE) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      if (!side) return reject(new Error('empty_image'))
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      )
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode_failed'))
    }
    img.src = url
  })
}

async function listOwn(userId) {
  const { data } = await supabase.storage.from(BUCKET).list(userId)
  return (data ?? []).map((f) => `${userId}/${f.name}`)
}

export async function uploadAvatar(userId, file) {
  if (!file.type.startsWith('image/')) throw new Error('not_image')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('too_large')

  const blob = await squareJpeg(file)
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { data, error: rpcError } = await supabase.rpc('set_avatar_url', { p_url: publicUrl })
  if (rpcError || !data?.ok) {
    // Profile yazılamadıysa dosya ortada kalmasın.
    await supabase.storage.from(BUCKET).remove([path])
    throw rpcError ?? new Error(data?.reason ?? 'set_failed')
  }

  const stale = (await listOwn(userId)).filter((p) => p !== path)
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale)
  return publicUrl
}

export async function removeAvatar(userId) {
  const { data, error } = await supabase.rpc('set_avatar_url', { p_url: null })
  if (error || !data?.ok) throw error ?? new Error('remove_failed')
  const all = await listOwn(userId)
  if (all.length) await supabase.storage.from(BUCKET).remove(all)
}
