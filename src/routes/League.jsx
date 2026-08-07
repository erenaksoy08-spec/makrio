import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isGold } from '../lib/gold'
import GoldGate from '../components/GoldGate'
import BackButton from '../components/BackButton'
import { todayStr } from '../lib/date'
import { scoreDay, scoreColor, fmtScore } from '../lib/dayScore'
import { REWARDS, isUnlocked } from '../lib/rewards'
import { GOLD_NAME_STYLE, BRONZE_NAME_STYLE } from '../lib/store'
import { Skeleton } from '../components/SkeletonLoader'
import BronzeBadge from '../components/BronzeBadge'
import usePixelTheme from '../hooks/usePixelTheme'
import { PixelFlame } from '../components/pixelSprites'
import LeagueSocial, { HeartIcon, BubbleIcon, timeAgo } from '../components/LeagueSocial'
import { t } from '../lib/i18n'

// İlk üç sıranın tonu: altın, gümüş, bronz. Gerisi nötr.
const RANK_TONES = ['#F2C94C', '#C9CDD3', '#E0A34E']

function memberScore(row) {
  return scoreDay(
    { calories: row.calories, protein: row.protein_g, carbs: row.carbs_g, fat: row.fat_g, water_ml: row.water_ml },
    {
      calories: row.goal_calories,
      protein_g: row.goal_protein_g,
      carbs_g: row.goal_carbs_g,
      fat_g: row.goal_fat_g,
      water_ml: row.goal_water_ml,
    },
  )
}

function memberBadges(row) {
  const peak = Math.max(row.current_streak ?? 0, row.longest_streak ?? 0)
  const unlocked = REWARDS.filter((r) => isUnlocked(peak, r.days))
  // Rütbe rozetlerinden yalnızca en yükseği görünür — kademeler birbirinin yerine geçer.
  const topBadge = unlocked.filter((r) => r.type === 'badge').at(-1)
  return unlocked.filter((r) => r.type !== 'badge').concat(topBadge ? [topBadge] : [])
}

function RankChip({ index }) {
  const tone = RANK_TONES[index]
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[15px] font-bold tabular-nums"
      style={
        tone
          ? { color: tone, borderColor: `${tone}59`, backgroundColor: `${tone}14` }
          : { color: 'var(--color-text-muted)', borderColor: 'rgba(255,255,255,0.07)' }
      }
    >
      {index + 1}
    </span>
  )
}

// Arkadaş Ligi Gold'a özel — free kullanıcı içerik yerine Gold kapısını görür.
export default function League() {
  const { profile, profileLoading } = useAuth()
  const navigate = useNavigate()
  if (!profileLoading && !isGold(profile)) {
    return <GoldGate feature="league" onClose={() => navigate(-1)} />
  }
  if (profileLoading) return null
  return <LeagueBoard />
}

export function LeagueBoard() {
  const { user, profile } = useAuth()
  const pixelUi = usePixelTheme()
  const today = todayStr()

  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState(null)
  const [rows, setRows] = useState([])
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
  const [copied, setCopied] = useState(false)
  const [addCode, setAddCode] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null) // { tone: 'ok' | 'err', text }
  const [expanded, setExpanded] = useState(null)
  const [social, setSocial] = useState({}) // {id: {like_count, liked_by_me, comment_count}}
  const [notifCount, setNotifCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(null) // null = henüz açılmadı

  const loadAll = useCallback(async () => {
    const [codeRes, boardRes, reqRes, socialRes, unreadRes] = await Promise.all([
      supabase.rpc('get_my_friend_code'),
      supabase.rpc('get_leaderboard', { p_date: today }),
      supabase.rpc('get_friend_requests'),
      supabase.rpc('get_league_social'),
      supabase.rpc('get_unread_league_count'),
    ])
    setCode(codeRes.data ?? null)
    setRows(boardRes.data ?? [])
    setRequests(reqRes.data ?? { incoming: [], outgoing: [] })
    setSocial(Object.fromEntries((socialRes.data ?? []).map((s) => [s.target_id, s])))
    setNotifCount(unreadRes.data ?? 0)
    setLoading(false)
  }, [today])

  async function openNotifs() {
    const next = !notifOpen
    setNotifOpen(next)
    if (!next) return
    const { data } = await supabase.rpc('get_league_notifications')
    setNotifs(Array.isArray(data) ? data : [])
    // Panel açıldı = görüldü; rozet söner.
    supabase.rpc('mark_league_notifications_read')
    setNotifCount(0)
  }

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* pano erişimi yoksa kod zaten ekranda */
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const value = addCode.trim()
    if (!value || sending) return
    setSending(true)
    setNotice(null)
    const { data, error } = await supabase.rpc('send_friend_request', { p_code: value })
    setSending(false)
    if (error) {
      setNotice({ tone: 'err', text: t('Bir şeyler ters gitti, tekrar dene.') })
      return
    }
    if (data.ok) {
      setAddCode('')
      setNotice({
        tone: 'ok',
        text: data.accepted
          ? t('{name} seni zaten eklemişti — artık arkadaşsınız! 🎉', { name: data.name ?? t('Arkadaşın') })
          : t('{name} istek gönderildi.', { name: data.name ?? t('Kullanıcıya') }),
      })
      loadAll()
    } else {
      const msgs = {
        not_found: t('Bu koda sahip bir kullanıcı bulunamadı.'),
        self: t('Bu senin kendi kodun 🙂'),
        already_friends: t('{name} zaten arkadaşın.', { name: data.name ?? t('Bu kişi') }),
        already_pending: t('{name} için istek zaten gönderilmiş.', { name: data.name ?? t('Bu kişi') }),
      }
      setNotice({ tone: 'err', text: msgs[data.reason] ?? t('İstek gönderilemedi.') })
    }
  }

  async function respond(id, accept) {
    await supabase.rpc('respond_friend_request', { p_id: id, p_accept: accept })
    loadAll()
  }

  async function cancelOutgoing(id) {
    await supabase.rpc('cancel_friend_request', { p_id: id })
    loadAll()
  }

  async function removeFriend(row) {
    if (!window.confirm(t('{name} listeden çıkarılsın mı?', { name: row.name ?? t('Bu arkadaşı') }))) return
    await supabase.rpc('remove_friend', { p_friend: row.id })
    loadAll()
  }

  const ranked = [...rows]
    .map((r) => ({ ...r, score: memberScore(r), badges: memberBadges(r) }))
    .sort(
      (a, b) =>
        (b.current_streak ?? 0) - (a.current_streak ?? 0) ||
        b.score.total - a.score.total ||
        String(a.name).localeCompare(String(b.name), 'tr'),
    )

  const flame = pixelUi ? (
    <span className="pixel-flicker inline-flex">
      <PixelFlame size={11} />
    </span>
  ) : (
    <span className="text-[11px]">🔥</span>
  )

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <BackButton to="/ilerleme" label={t('İlerleme')} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">{t('REKABET')}</div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-text">{t('Arkadaş Ligi 🏆')}</h1>
        </div>
        {/* bildirimler — beğeni/yorum gelince rozet yanar */}
        <button
          type="button"
          onClick={openNotifs}
          aria-label={t('Bildirimler')}
          className="btn-icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-text-muted"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 9.5a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M13.7 19.5a2 2 0 0 1-3.4 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#F26B6B] px-1 text-[10px] font-bold tabular-nums text-white">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {notifOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl border border-white/[0.06] bg-surface p-2">
              {notifs === null ? (
                <div className="p-3 text-xs text-text-muted opacity-60">…</div>
              ) : notifs.length === 0 ? (
                <div className="p-3 text-xs text-text-muted">{t('Henüz bildirim yok')}</div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 rounded-2xl px-3 py-2 ${n.unread ? 'bg-white/[0.03]' : ''}`}
                  >
                    <span className="mt-px text-[13px]">{n.kind === 'like' ? '❤️' : '💬'}</span>
                    <p className="min-w-0 flex-1 text-[13px] leading-snug text-text">
                      <span
                        className="font-semibold"
                        style={(() => {
                          if (n.actor_color === 'gold') return GOLD_NAME_STYLE
                          if (n.actor_color === 'bronze') return BRONZE_NAME_STYLE
                          return undefined
                        })()}
                      >
                        {n.actor_name ?? t('İsimsiz')}
                      </span>{' '}
                      {n.kind === 'like' ? t('ilerlemeni beğendi') : t('yorum yaptı:')}
                      {n.kind === 'comment' && n.preview && (
                        <span className="text-text-muted"> “{n.preview}”</span>
                      )}
                      <span className="ml-1.5 whitespace-nowrap text-[10px] text-text-muted">{timeAgo(n.created_at)}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-3xl" />
        </div>
      ) : (
        <>
          {/* kod + arkadaş ekleme — tek kompakt kart */}
          <div className="rounded-3xl border border-white/[0.06] bg-surface">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                  {t('Arkadaş Kodun')}
                </div>
                <div className="mt-0.5 text-[22px] font-bold tracking-[0.24em] tabular-nums text-text">{code}</div>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="btn-chip shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-text"
              >
                {copied ? t('✓ Kopyalandı') : t('Kopyala')}
              </button>
            </div>

            <form onSubmit={handleSend} className="border-t border-white/[0.05] p-4">
              <div className="flex gap-2">
                <input
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                  placeholder={t('Arkadaş kodu')}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-transparent px-4 py-2.5 text-center text-sm font-semibold tracking-[0.25em] uppercase text-text placeholder:font-normal placeholder:tracking-normal placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={addCode.trim().length < 4 || sending}
                  className="btn-chip shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {sending ? '…' : t('Ekle')}
                </button>
              </div>
              <AnimatePresence>
                {notice && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-2 px-1 text-xs ${notice.tone === 'ok' ? 'text-[#6FCF97]' : 'text-[#EF4444]'}`}
                  >
                    {notice.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* bekleyen istekler */}
          {(requests.incoming.length > 0 || requests.outgoing.length > 0) && (
            <div className="space-y-3 rounded-3xl border border-white/[0.06] bg-surface p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">{t('İstekler')}</span>
              {requests.incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-text">
                    <span className="font-semibold">{r.name ?? t('İsimsiz')}</span>{t(' seni eklemek istiyor')}
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => respond(r.id, true)}
                      className="btn-icon flex h-9 w-9 items-center justify-center rounded-full bg-[#6FCF97] text-black"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(r.id, false)}
                      className="btn-icon flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
              {requests.outgoing.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-text-muted">
                    <span className="font-semibold text-text">{r.name ?? t('İsimsiz')}</span>{t(' — istek bekliyor ⏳')}
                  </span>
                  <button
                    type="button"
                    onClick={() => cancelOutgoing(r.id)}
                    className="btn-chip shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs text-text-muted"
                  >
                    {t('İptal')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* liderlik tablosu — tek kart, bölücülü satırlar */}
          <div>
            <div className="flex items-baseline justify-between px-1 pb-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">{t('Liderlik Tablosu')}</span>
              <span className="text-xs tabular-nums text-text-muted">{t('{n} kişi', { n: ranked.length })}</span>
            </div>

            {ranked.length <= 1 ? (
              <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
                {t('Henüz arkadaşın yok. Kodunu paylaş, lig dolsun! 🏁')}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-surface">
                {ranked.map((row, i) => {
                  const isMe = row.id === user?.id
                  const loggedToday = row.last_log_date === today
                  const open = expanded === row.id
                  const soc = social[row.id] ?? { like_count: 0, liked_by_me: false, comment_count: 0 }
                  const kcalPct = row.goal_calories
                    ? Math.min(100, (row.calories / row.goal_calories) * 100)
                    : 0
                  return (
                    <div key={row.id} className={`${i > 0 ? 'border-t border-white/[0.05]' : ''} ${isMe ? 'bg-white/[0.025]' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : row.id)}
                        className="btn-chip flex w-full items-center gap-3 p-4 text-left"
                      >
                        <RankChip index={i} />

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className="truncate text-[15px] font-semibold"
                              style={(() => {
                                const nameColor = isMe ? profile?.preferences?.nameColor : row.name_color
                                if (nameColor === 'gold') return GOLD_NAME_STYLE
                                if (nameColor === 'bronze') return BRONZE_NAME_STYLE
                                return { color: 'var(--color-text)' }
                              })()}
                            >
                              {row.name ?? t('İsimsiz')}
                            </span>
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                {t('SEN')}
                              </span>
                            )}
                            {loggedToday && (
                              <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#6FCF97]" title={t('Bugün kayıt yaptı')} />
                            )}
                          </span>

                          <span className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                            {flame}
                            <span className="font-semibold tabular-nums text-text">{row.current_streak ?? 0}</span>
                            <span>{t('gün')}</span>
                            {row.badges.length > 0 && (
                              <span className="ml-1 inline-flex gap-0.5 text-[11px] opacity-80">
                                {row.badges.map((b) =>
                                  b.type === 'badge' ? (
                                    <span key={b.id} className="inline-flex align-middle">
                                      <BronzeBadge size={13} tier={b.value} />
                                    </span>
                                  ) : (
                                    <span key={b.id}>{b.icon}</span>
                                  ),
                                )}
                              </span>
                            )}
                            {/* sosyal özet — kalp kırmızı kalır (ben beğendiysem) */}
                            {soc.like_count > 0 && (
                              <span
                                className="ml-1 inline-flex items-center gap-0.5 tabular-nums"
                                style={soc.liked_by_me ? { color: '#F26B6B' } : undefined}
                              >
                                <HeartIcon filled={soc.liked_by_me} size={11} />
                                {soc.like_count}
                              </span>
                            )}
                            {soc.comment_count > 0 && (
                              <span className="inline-flex items-center gap-0.5 tabular-nums">
                                <BubbleIcon size={11} />
                                {soc.comment_count}
                              </span>
                            )}
                          </span>

                          {/* bugünkü kalori — mini bar */}
                          <span className="mt-2 flex items-center gap-2">
                            <span className="bar-track h-1.5 max-w-[130px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                              <span
                                className="bar-fill block h-full rounded-full"
                                style={{
                                  width: `${kcalPct}%`,
                                  backgroundColor: 'color-mix(in srgb, var(--color-text) 80%, transparent)',
                                  transition: 'width 700ms cubic-bezier(0.34, 1.1, 0.64, 1)',
                                }}
                              />
                            </span>
                            <span className="text-[10px] tabular-nums text-text-muted">
                              {Math.round(row.calories)}
                              {row.goal_calories ? ` / ${Math.round(row.goal_calories)}` : ''} kcal
                            </span>
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span
                            className="block text-xl font-bold tabular-nums"
                            style={{ color: scoreColor(row.score.total) }}
                          >
                            {fmtScore(row.score.total)}
                          </span>
                          <span className="block text-[10px] text-text-muted">{t('puan')}</span>
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 px-4 pb-4">
                              <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                                <div className="rounded-2xl border border-white/[0.05] p-3">
                                  <div className="text-[11px] text-text-muted">{t('Protein')}</div>
                                  <div className="font-semibold" style={{ color: '#FF8A5B' }}>
                                    {Math.round(row.protein_g)}
                                    {row.goal_protein_g ? `/${Math.round(row.goal_protein_g)}` : ''} g
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-white/[0.05] p-3">
                                  <div className="text-[11px] text-text-muted">{t('Karb · Yağ')}</div>
                                  <div className="font-semibold text-text">
                                    <span style={{ color: '#6FCF97' }}>{Math.round(row.carbs_g)}g</span>
                                    {' · '}
                                    <span style={{ color: '#F2C94C' }}>{Math.round(row.fat_g)}g</span>
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-white/[0.05] p-3">
                                  <div className="text-[11px] text-text-muted">{t('Su')}</div>
                                  <div className="font-semibold" style={{ color: '#29B6F6' }}>
                                    {Math.round(row.water_ml)}
                                    {row.goal_water_ml ? `/${Math.round(row.goal_water_ml)}` : ''} ml
                                  </div>
                                </div>
                              </div>

                              {/* beğeni + yorumlar — arkadaşlar birbirini gazlar 🎉 */}
                              <LeagueSocial
                                targetId={row.id}
                                isMe={isMe}
                                summary={soc}
                                onSummary={(next) => setSocial((s) => ({ ...s, [row.id]: next }))}
                              />

                              <div className="flex items-center justify-between px-1">
                                {/* rekor seri — altın madalya rozeti */}
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
                                  style={{
                                    borderColor: 'rgba(242,169,59,0.35)',
                                    background:
                                      'linear-gradient(135deg, rgba(242,169,59,0.16), rgba(242,201,76,0.04))',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                                  }}
                                >
                                  <span className="text-[11px]" style={{ filter: 'drop-shadow(0 0 4px rgba(242,169,59,0.5))' }}>
                                    🏅
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                                    {t('Rekor Seri')}
                                  </span>
                                  <span className="text-[12px] font-bold tabular-nums" style={{ color: '#F2C94C' }}>
                                    {t('{n} gün', { n: row.longest_streak ?? 0 })}
                                  </span>
                                </span>
                                {!isMe && (
                                  <button
                                    type="button"
                                    onClick={() => removeFriend(row)}
                                    className="btn-chip rounded-xl px-2 py-1 text-[11px] text-[#EF4444]/80"
                                  >
                                    {t('Arkadaşlıktan çıkar')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
