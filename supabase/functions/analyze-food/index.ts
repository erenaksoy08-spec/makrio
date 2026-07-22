import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Fotoğraf + açıklama → yapılandırılmış makro tahmini.
//
// Model: claude-haiku-4-5 (hız/maliyet dengesi — çağrı başı ~1-3 sn, ~yarım kuruş).
//        AI_FOOD_MODEL secret'ı ile Sonnet'e yükseltilebilir.
// Girdi:  { image_base64, media_type, description? }
// Çıktı:  { name, total_grams, calories, protein_g, carbs_g, fat_g,
//           confidence, items[], notes }
//
// Kullanıcı açıklaması görsel tahminden ÖNCELİKLİDİR (MacroFactor yaklaşımı):
// yazılı miktar/malzeme bilgisi genelde salt görsel tahminden daha güvenilir.
// İleride ses girişi aynı sözleşmeyle eklenir: transkript description alanına akar.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const SYSTEM = `Sen deneyimli bir beslenme analistisin. Sana bir yemek fotoğrafı ve (varsa) kullanıcının yazdığı açıklama verilecek. Görevin: tabaktaki porsiyonun TAMAMI için besin değeri tahmini yapmak.

Kurallar:
1. Kullanıcının açıklamasındaki miktar ve malzeme bilgileri senin görsel tahmininden ÖNCELİKLİDİR. Çelişki varsa kullanıcının verdiği sayıları esas al; açıklamada geçmeyen kalemleri fotoğraftan tamamla.
2. Fotoğraftan şunları çıkar: yemek türü, görünür yağ/sos/tereyağı kullanımı, tabak/kap boyutuna göre porsiyon büyüklüğü.
3. Türk mutfağını iyi tanıyorsun (menemen, kuru fasulye, karnıyarık, pide, mantı...). Yemeği Türkçe adıyla adlandır.
4. Kalori, 4/4/9 kcal kuralıyla (protein/karbonhidrat x4, yağ x9) makrolarla tutarlı olsun.
5. Emin olmadığında confidence değerini düşür ve notes içinde tek cümleyle nedenini belirt.
6. SADECE geçerli JSON döndür, başka hiçbir metin yazma. Şema:
{"name": "kısa Türkçe yemek adı", "total_grams": sayı, "calories": sayı, "protein_g": sayı, "carbs_g": sayı, "fat_g": sayı, "confidence": "low"|"medium"|"high", "items": [{"name": "kalem", "grams": sayı, "calories": sayı}], "notes": "tek cümle Türkçe gerekçe"}`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'ai_not_configured' }, 503)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  const imageBase64 = payload?.image_base64
  if (typeof imageBase64 !== 'string' || imageBase64.length < 100) {
    return json({ error: 'image_required' }, 400)
  }
  // base64 ~2.8M karakter ≈ 2 MB görsel — istemci zaten 1024px'e küçültüyor.
  if (imageBase64.length > 2_800_000) return json({ error: 'image_too_large' }, 413)

  const mediaType = ['image/jpeg', 'image/png', 'image/webp'].includes(String(payload?.media_type))
    ? String(payload?.media_type)
    : 'image/jpeg'
  const desc = String(payload?.description ?? '').trim().slice(0, 600)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('AI_FOOD_MODEL') ?? 'claude-haiku-4-5',
      max_tokens: 900,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            {
              type: 'text',
              text: desc
                ? `Kullanıcının açıklaması: "${desc}"`
                : 'Kullanıcı açıklama yazmadı — yalnızca fotoğraftan tahmin et.',
            },
          ],
        },
        // Yanıtı "{" ile başlatarak modeli düz JSON'a kilitle.
        { role: 'assistant', content: '{' },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('anthropic_error', res.status, detail.slice(0, 300))
    return json({ error: 'ai_failed' }, 502)
  }

  const data = await res.json()
  const text = '{' + (data?.content?.[0]?.text ?? '')
  let parsed: Record<string, unknown> | null = null
  try {
    parsed = JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        parsed = JSON.parse(m[0])
      } catch {
        parsed = null
      }
    }
  }
  if (!parsed) return json({ error: 'ai_unparseable' }, 502)

  // Değerleri makul aralıklara sabitle — model saçmalarsa istemciye taşmasın.
  const g1 = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round((Number(v) || 0) * 10) / 10))
  const items = Array.isArray(parsed.items)
    ? (parsed.items as unknown[]).slice(0, 8).map((raw) => {
        const it = raw as Record<string, unknown>
        return {
          name: String(it?.name ?? '').slice(0, 60),
          grams: Math.max(0, Math.round(Number(it?.grams) || 0)),
          calories: Math.max(0, Math.round(Number(it?.calories) || 0)),
        }
      })
    : []

  return json({
    name: String(parsed.name ?? 'Yemek').slice(0, 80),
    total_grams: Math.max(1, Math.min(3000, Math.round(Number(parsed.total_grams) || 0) || 250)),
    calories: Math.round(Math.max(0, Math.min(6000, Number(parsed.calories) || 0))),
    protein_g: g1(parsed.protein_g, 500),
    carbs_g: g1(parsed.carbs_g, 800),
    fat_g: g1(parsed.fat_g, 400),
    confidence: ['low', 'medium', 'high'].includes(String(parsed.confidence))
      ? String(parsed.confidence)
      : 'medium',
    items,
    notes: String(parsed.notes ?? '').slice(0, 240),
  })
})
