import { supabase } from './supabase'
import { t } from './i18n'

// Fotoğraf + açıklama → AI makro tahmini (analyze-food edge function).
// Akış genişletilebilir kurgulandı: ileride ses girişi eklendiğinde transkript
// aynı `description` alanına akar, sözleşme değişmez.

// HEIC gibi createImageBitmap'in desteklemediği biçimlerde <img> yoluna düşer.
async function decodeImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    try {
      return await new Promise((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('decode'))
        el.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

// Fotoğrafı çağrı için küçültür: uzun kenar 1024 px, JPEG %80.
// Hem istek hızlanır hem de görsel token maliyeti düşer.
export async function fileToAiImage(file) {
  const src = await decodeImage(file)
  const w = src.width || src.naturalWidth
  const h = src.height || src.naturalHeight
  const scale = Math.min(1, 1024 / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height)
  src.close?.()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return { base64: dataUrl.split(',')[1], mediaType: 'image/jpeg', previewUrl: dataUrl }
}

// Edge function çağrısı — hata kodlarını kullanıcı diline çevirir.
export async function analyzeFoodPhoto({ base64, mediaType, description }) {
  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { image_base64: base64, media_type: mediaType, description },
  })
  if (error) {
    let code = ''
    try {
      const body = await error.context?.json?.()
      code = body?.error ?? ''
    } catch {
      /* gövde okunamadı — genel mesaja düş */
    }
    if (code === 'ai_not_configured') throw new Error(t('AI servisi henüz yapılandırılmadı — çok yakında.'))
    if (code === 'image_too_large') throw new Error(t('Fotoğraf çok büyük, tekrar dene.'))
    throw new Error(t('Analiz başarısız oldu — tekrar dene.'))
  }
  return data
}
