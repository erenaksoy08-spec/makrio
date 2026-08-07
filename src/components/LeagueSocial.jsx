import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { GOLD_NAME_STYLE, BRONZE_NAME_STYLE } from '../lib/store'
import { t, getIntlLocale } from '../lib/i18n'

// Lig satırının sosyal bloğu: kalp + kompakt yorum akışı (IG yorum düzeni).
// Sayaçlar üstte (get_league_social) yaşar; akış her açılışta taze çekilir.

const LIKE_RED = '#F26B6B'

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return t('şimdi')
  if (s < 3600) return t('{n} dk', { n: Math.floor(s / 60) })
  if (s < 86400) return t('{n} sa', { n: Math.floor(s / 3600) })
  if (s < 7 * 86400) return t('{n} g', { n: Math.floor(s / 86400) })
  return new Date(iso).toLocaleDateString(getIntlLocale(), { day: 'numeric', month: 'short' })
}

function nameStyle(color) {
  if (color === 'gold') return GOLD_NAME_STYLE
  if (color === 'bronze') return BRONZE_NAME_STYLE
  return undefined
}

export function HeartIcon({ filled, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M12 20.6 4.6 13.4a4.9 4.9 0 0 1 0-7 5 5 0 0 1 7 0l.4.4.4-.4a5 5 0 0 1 7 0 4.9 4.9 0 0 1 0 7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BubbleIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12a8 8 0 0 1-8 8H4.5l1.8-2.7A8 8 0 1 1 21 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LeagueSocial({ targetId, isMe, summary, onSummary }) {
  const [comments, setComments] = useState(null) // null = yükleniyor
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    let alive = true
    supabase.rpc('get_league_comments', { p_target: targetId }).then(({ data }) => {
      if (alive) setComments(Array.isArray(data) ? data : [])
    })
    return () => {
      alive = false
    }
  }, [targetId])

  // Yeni yorum/ilk yükleme: en alta kay — sohbet gibi.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [comments])

  async function toggleLike() {
    if (isMe) return
    // İyimser: kalp anında döner, hata olursa geri alınır.
    const prev = summary
    onSummary({
      ...prev,
      liked_by_me: !prev.liked_by_me,
      like_count: prev.like_count + (prev.liked_by_me ? -1 : 1),
    })
    const { data, error: err } = await supabase.rpc('toggle_league_like', { p_target: targetId })
    if (err || !data?.ok) {
      onSummary(prev)
      return
    }
    onSummary({ ...prev, liked_by_me: data.liked, like_count: data.count })
  }

  async function sendComment(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const { data, error: err } = await supabase.rpc('add_league_comment', { p_target: targetId, p_body: body })
    setSending(false)
    if (err || !data?.ok) {
      setError(t('Yorum gönderilemedi, tekrar dene.'))
      return
    }
    setDraft('')
    setComments((c) => [...(c ?? []), data.comment])
    onSummary({ ...summary, comment_count: summary.comment_count + 1 })
  }

  async function removeComment(id) {
    const prev = comments
    setComments((c) => c.filter((x) => x.id !== id))
    onSummary({ ...summary, comment_count: Math.max(0, summary.comment_count - 1) })
    const { data } = await supabase.rpc('delete_league_comment', { p_id: id })
    if (!data) {
      setComments(prev)
      onSummary({ ...summary })
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.05]">
      {/* aksiyon satırı — IG düzeni: kalp + sayı, balon + sayı */}
      <div className="flex items-center gap-4 px-3.5 pt-2.5 pb-1.5">
        <motion.button
          type="button"
          onClick={toggleLike}
          disabled={isMe}
          aria-label={t('Beğen')}
          aria-pressed={summary.liked_by_me}
          whileTap={isMe ? undefined : { scale: 0.8 }}
          className="btn-icon inline-flex items-center gap-1.5 disabled:cursor-default"
          style={{ color: summary.liked_by_me ? LIKE_RED : 'var(--color-text-muted)' }}
        >
          <motion.span
            key={summary.liked_by_me ? 'on' : 'off'}
            initial={summary.liked_by_me ? { scale: 1.45 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="inline-flex"
          >
            <HeartIcon filled={summary.liked_by_me} />
          </motion.span>
          <span className="text-xs font-semibold tabular-nums">{summary.like_count || ''}</span>
        </motion.button>

        <span className="inline-flex items-center gap-1.5 text-text-muted">
          <BubbleIcon />
          <span className="text-xs font-semibold tabular-nums">{summary.comment_count || ''}</span>
        </span>
      </div>

      {/* akış */}
      <div ref={listRef} className="max-h-44 space-y-2 overflow-y-auto px-3.5 pb-1">
        {comments === null ? (
          <div className="py-1.5 text-xs text-text-muted opacity-60">…</div>
        ) : comments.length === 0 ? (
          <div className="py-1.5 text-xs text-text-muted">{t('İlk yorumu sen yaz 💬')}</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2">
              <span
                className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[10px] font-bold uppercase text-text-muted"
                aria-hidden="true"
              >
                {(c.author_name ?? '?').trim().charAt(0) || '?'}
              </span>
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-text">
                <span className="font-semibold" style={nameStyle(c.author_color)}>
                  {c.author_name ?? t('İsimsiz')}
                </span>{' '}
                {c.body}
                <span className="ml-1.5 whitespace-nowrap text-[10px] text-text-muted">{timeAgo(c.created_at)}</span>
              </p>
              {c.can_delete && (
                <button
                  type="button"
                  onClick={() => removeComment(c.id)}
                  aria-label={t('Yorumu sil')}
                  className="btn-icon shrink-0 px-1 text-[11px] text-text-muted opacity-40 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      {/* yaz */}
      <form onSubmit={sendComment} className="flex items-center gap-2 border-t border-white/[0.05] px-3.5 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder={t('Yorum yaz…')}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted/50"
        />
        <motion.button
          type="submit"
          disabled={!draft.trim() || sending}
          whileTap={{ scale: 0.9 }}
          aria-label={t('Gönder')}
          className="btn-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 19V6m0 0-5.5 5.5M12 6l5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </form>
    </div>
  )
}
