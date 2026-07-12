import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BackButton from '../components/BackButton'
import PlateIcon from '../components/PlateIcon'
import PlateBalance from '../components/PlateBalance'
import { todayStr } from '../lib/date'
import { scoopBalance } from '../lib/store'
import { buildMilestones, buildDaily, buildRepeatables, questState } from '../lib/quests'
import useBlokTheme from '../hooks/useBlokTheme'
import { BlokCheck } from '../components/blokSprites'

// Görev Panosu'nun kendi büyüsü — menekşe gece + altın ışık.
const GOLD = '#F2C94C'
const VIOLET = '#8B5CF6'
const VIOLET_SOFT = 'rgba(139,92,246,0.28)'
const IVORY = '#EDE9F7'
const MUTED = '#8E86A3'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// Bölüm ayracı — rune çizgisi
function RuneDivider({ children, hint }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-3">
      <span className="text-[9px]" style={{ color: VIOLET }}>
        ✦
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: IVORY }}>
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${VIOLET_SOFT}, transparent)` }}
      />
      {hint && (
        <span className="text-[8.5px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
          {hint}
        </span>
      )}
    </div>
  )
}

// Toplama patlaması — altın kıvılcımlar + "+X" uçuşu
function CollectBurst({ amount }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        angle: (i / 7) * Math.PI * 2 + rand(-0.2, 0.2),
        dist: rand(24, 44),
        size: rand(2.5, 4.5),
      })),
    [],
  )
  return (
    <>
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute right-8 top-1/2 z-10 rounded-full"
          style={{ width: s.size, height: s.size, backgroundColor: i % 2 ? GOLD : '#C4B5FD', boxShadow: `0 0 6px ${GOLD}` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: Math.cos(s.angle) * s.dist, y: Math.sin(s.angle) * s.dist, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        initial={{ opacity: 0, y: 0, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], y: -36, scale: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="pointer-events-none absolute right-4 top-1 z-10 flex items-center gap-1 text-sm font-black"
        style={{ color: GOLD, textShadow: `0 0 10px ${GOLD}80` }}
      >
        +{amount} <PlateIcon size={16} />
      </motion.span>
    </>
  )
}

// TOPLA — basılınca plaka döner, şok dalgası yayılır; üstünde ışık süpürmesi gezer.
function CollectButton({ disabled, onClick, small = false }) {
  const [pressStamp, setPressStamp] = useState(0)

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        setPressStamp(Date.now())
        onClick(e)
      }}
      whileTap={{ scale: 0.86 }}
      animate={{ boxShadow: [`0 0 0px ${GOLD}00`, `0 0 18px ${GOLD}59`, `0 0 0px ${GOLD}00`] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`btn-primary relative overflow-hidden rounded-full font-bold uppercase tracking-[0.14em] disabled:opacity-50 ${
        small ? 'py-1 pl-1.5 pr-3 text-[9px]' : 'py-1.5 pl-2 pr-3.5 text-[10px]'
      }`}
      style={{
        background: `linear-gradient(135deg, #FBE38A, ${GOLD} 55%, #C9962E)`,
        color: '#1b1206',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.25)`,
      }}
    >
      {/* iç çerçeve + sürekli gezen ışık süpürmesi */}
      <span className="pointer-events-none absolute inset-[2.5px] rounded-full" style={{ border: '1px solid rgba(0,0,0,0.22)' }} />
      <motion.span
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.6) 50%, transparent 62%)' }}
        animate={{ x: ['-110%', '110%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
      />

      {/* basınca yayılan şok dalgası */}
      <AnimatePresence>
        {pressStamp > 0 && (
          <motion.span
            key={pressStamp}
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ border: `2px solid ${GOLD}` }}
            initial={{ scale: 0.75, opacity: 0.9 }}
            animate={{ scale: 2.1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <span className="relative flex items-center gap-1.5">
        {/* mini plaka — basınca tam tur döner */}
        <motion.span
          key={pressStamp}
          className="flex items-center"
          initial={pressStamp > 0 ? { rotate: 0 } : false}
          animate={pressStamp > 0 ? { rotate: 360 } : {}}
          transition={{ duration: 0.55, ease: [0.34, 1.3, 0.64, 1] }}
        >
          <PlateIcon size={small ? 13 : 16} />
        </motion.span>
        Topla
      </span>
    </motion.button>
  )
}

// Büyü kartı — günlük / tekrarlanan / nişan görevleri
function QuestCard({ quest, index, saving, onCollect, gain }) {
  const blok = useBlokTheme()
  const ready = quest.available != null ? quest.available > 0 : quest.ready
  const collected = quest.available != null ? quest.available === 0 && quest.collectedCount > 0 : quest.collected
  const locked = !ready && !collected
  const count = quest.available ?? 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className={`relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 ${ready ? 'vitrin-frame' : ''}`}
      style={
        ready
          ? { opacity: 1 }
          : {
              background: 'linear-gradient(160deg, rgba(139,92,246,0.08), rgba(10,8,20,0.65) 70%)',
              border: `1px solid ${collected ? 'rgba(139,92,246,0.12)' : VIOLET_SOFT}`,
              opacity: collected ? 0.5 : 1,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }
      }
    >
      <AnimatePresence>{gain === quest.id && <CollectBurst amount={quest.reward * count} />}</AnimatePresence>

      {/* ikon küresi — süzülen büyü orbu */}
      <motion.span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
        animate={ready ? { y: [0, -2.5, 0] } : {}}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
        style={{
          background: ready
            ? `radial-gradient(circle at 38% 30%, ${GOLD}38, ${GOLD}0d)`
            : `radial-gradient(circle at 38% 30%, ${VIOLET}26, transparent 75%)`,
          border: `1px solid ${ready ? `${GOLD}59` : VIOLET_SOFT}`,
          boxShadow: ready ? `0 0 14px ${GOLD}40` : 'none',
          filter: collected ? 'grayscale(0.7)' : 'none',
        }}
      >
        {collected ? (blok ? <BlokCheck size={14} color={GOLD} /> : '✓') : quest.icon}
      </motion.span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold" style={{ color: IVORY }}>
            {quest.title}
          </span>
          {quest.collectedCount > 0 && quest.available != null && (
            <span className="shrink-0 text-[9px] tabular-nums" style={{ color: MUTED }}>
              ×{quest.collectedCount}
            </span>
          )}
        </div>
        <div className="truncate text-[10.5px]" style={{ color: MUTED }}>
          {quest.sub}
        </div>
        {/* mana kanalı — kilitli ilerleme */}
        {locked && quest.target > 1 && quest.progress != null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className={`h-1.5 max-w-[110px] flex-1 overflow-hidden rounded-full ${blok ? 'bar-track' : ''}`}
              style={{ background: 'rgba(0,0,0,0.4)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
            >
              <div
                className={`h-full rounded-full ${blok ? 'bar-fill' : ''}`}
                style={{
                  width: `${(quest.progress / quest.target) * 100}%`,
                  background: `linear-gradient(90deg, ${VIOLET}, #C4B5FD)`,
                  boxShadow: `0 0 8px ${VIOLET}80`,
                  transition: 'width 700ms cubic-bezier(0.34, 1.1, 0.64, 1)',
                }}
              />
            </div>
            <span className="text-[9px] tabular-nums" style={{ color: MUTED }}>
              {quest.progress}/{quest.target}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="flex items-center gap-1">
          <PlateIcon size={15} />
          <span className="text-[12px] font-bold tabular-nums" style={{ color: GOLD }}>
            {quest.reward}
            {quest.available != null && quest.available > 1 ? `×${quest.available}` : ''}
          </span>
        </span>
        {ready ? (
          <CollectButton disabled={saving} onClick={(e) => onCollect(quest, e)} />
        ) : collected ? (
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: `${GOLD}80` }}>
            Toplandı
          </span>
        ) : quest.progress == null ? (
          <span className="text-[9px]" style={{ color: MUTED }}>
            —
          </span>
        ) : null}
      </div>
    </motion.div>
  )
}

// Seri Yolu düğümü — patika üstünde bir kader taşı
function TrailNode({ quest, index, isNext, saving, onCollect, gain }) {
  const blok = useBlokTheme()
  const state = quest.collected ? 'done' : quest.ready ? 'ready' : 'locked'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.3 }}
      className="relative flex items-center gap-3 py-1.5"
    >
      <AnimatePresence>{gain === quest.id && <CollectBurst amount={quest.reward} />}</AnimatePresence>

      {/* düğüm */}
      <span
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
          state === 'ready' ? 'medal-pulse' : ''
        }`}
        style={
          state === 'done'
            ? {
                background: `radial-gradient(circle at 36% 30%, #FBE38A, ${GOLD} 60%, #B8871F)`,
                color: '#1b1206',
                border: '1px solid rgba(0,0,0,0.35)',
                boxShadow: `0 0 10px ${GOLD}4D`,
              }
            : state === 'ready'
              ? {
                  background: `radial-gradient(circle at 36% 30%, ${GOLD}40, ${GOLD}0f)`,
                  color: GOLD,
                  border: `1.5px solid ${GOLD}`,
                  boxShadow: `0 0 14px ${GOLD}59`,
                }
              : {
                  background: 'rgba(10,8,20,0.8)',
                  color: isNext ? '#C4B5FD' : MUTED,
                  border: `1px solid ${isNext ? VIOLET : 'rgba(139,92,246,0.2)'}`,
                  boxShadow: isNext ? `0 0 10px ${VIOLET}40` : 'none',
                }
        }
      >
        {state === 'done' ? (blok ? <BlokCheck size={13} color="#1b1206" /> : '✓') : quest.target}
      </span>

      <div className="min-w-0 flex-1">
        <span
          className="block truncate text-[12.5px] font-semibold"
          style={{ color: state === 'locked' && !isNext ? MUTED : IVORY, opacity: state === 'done' ? 0.6 : 1 }}
        >
          {quest.title}
        </span>
        {/* sıradaki hedefte mana kanalı */}
        {isNext && (
          <div className="mt-1 flex items-center gap-2">
            <div
              className={`h-1.5 max-w-[120px] flex-1 overflow-hidden rounded-full ${blok ? 'bar-track' : ''}`}
              style={{ background: 'rgba(0,0,0,0.4)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
            >
              <div
                className={`h-full rounded-full ${blok ? 'bar-fill' : ''}`}
                style={{
                  width: `${(quest.progress / quest.target) * 100}%`,
                  background: `linear-gradient(90deg, ${VIOLET}, #C4B5FD)`,
                  boxShadow: `0 0 8px ${VIOLET}80`,
                  transition: 'width 700ms cubic-bezier(0.34, 1.1, 0.64, 1)',
                }}
              />
            </div>
            <span className="text-[9px] tabular-nums" style={{ color: MUTED }}>
              {quest.progress}/{quest.target}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex items-center gap-1">
          <PlateIcon size={13} />
          <span
            className="text-[11.5px] font-bold tabular-nums"
            style={{ color: state === 'locked' && !isNext ? MUTED : GOLD, opacity: state === 'done' ? 0.6 : 1 }}
          >
            {quest.reward}
          </span>
        </span>
        {state === 'ready' && <CollectButton small disabled={saving} onClick={(e) => onCollect(quest, e)} />}
      </div>
    </motion.div>
  )
}

export default function Quests() {
  const { profile, refreshProfile } = useAuth()
  const today = todayStr()
  const preferences = profile?.preferences ?? {}
  const balance = scoopBalance(preferences)

  const [saving, setSaving] = useState(false)
  const [gain, setGain] = useState(null)
  const [friendsCount, setFriendsCount] = useState(null)
  // plaka uçuşu: karttan kasaya kavisli yolculuk + sayaçta çarpma parlaması
  const balanceRef = useRef(null)
  const [flights, setFlights] = useState([])
  const [flash, setFlash] = useState(0)

  // Gece göğü — yıldızlar bir kez üretilir.
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        left: rand(2, 98),
        top: rand(2, 96),
        size: rand(1, 2.6),
        dur: rand(2.2, 5.5),
        delay: rand(0, 5),
        gold: Math.random() < 0.25,
      })),
    [],
  )

  // Arkadaş görevleri için lig üye sayısı (ben hariç).
  useEffect(() => {
    supabase.rpc('get_leaderboard', { p_date: today }).then(({ data }) => {
      if (data) setFriendsCount(Math.max(0, data.length - 1))
    })
  }, [today])

  const daily = buildDaily({ profile, today })
  const repeatables = buildRepeatables({ profile, today, friendsCount })
  const milestones = buildMilestones({ profile, today, friendsCount })

  // Nişanlar (tek seferlik, seri dışı) + Seri Yolu (5 → 500 patikası)
  const badges = milestones.filter((m) => !m.id.startsWith('streak-'))
  const trail = milestones.filter((m) => m.id.startsWith('streak-'))
  const nextIdx = trail.findIndex((t) => !t.ready && !t.collected)
  // patikanın aydınlanan kısmı: son tamamlanan/hazır düğüme kadar
  const litCount = trail.filter((t) => t.ready || t.collected).length

  async function collect(quest, e) {
    if (saving) return
    setSaving(true)
    const { daily: d, done } = questState(preferences, today)
    const claimedCount = (preferences.claimedRewards ?? []).length

    let amount = quest.reward
    const nextDaily = { ...d, collected: { ...(d.collected ?? {}) } }
    const nextDone = { ...done }

    if (quest.id === 'daily-streak') nextDaily.collected.streak = true
    else if (quest.id === 'daily-periods') nextDaily.collected.periods = true
    else if (quest.id === 'hall-claim') {
      amount = quest.reward * quest.available
      nextDone['hall-claim'] = claimedCount
    } else if (quest.id === 'friend-each') {
      amount = quest.reward * quest.available
      nextDone['friend-each'] = friendsCount
    } else if (quest.id === 'friend-bonus10') {
      amount = quest.reward * quest.available
      nextDone['friend-bonus10'] = Math.floor((friendsCount ?? 0) / 10)
    } else {
      nextDone[quest.id] = true
    }

    navigator.vibrate?.([14, 40, 22])
    setGain(quest.id)
    setTimeout(() => setGain(null), 1200)

    // plakalar butondan kasaya uçar; varınca sayaç parlar
    const btn = e?.currentTarget?.getBoundingClientRect?.()
    const target = balanceRef.current?.getBoundingClientRect?.()
    if (btn && target) {
      const from = { x: btn.left + btn.width / 2, y: btn.top + btn.height / 2 }
      const to = { x: target.left + target.width / 2, y: target.top + target.height / 2 }
      const n = amount >= 50 ? 5 : amount >= 15 ? 4 : 3
      const key = Date.now()
      setFlights((f) => [...f, { key, from, dx: to.x - from.x, dy: to.y - from.y, n }])
      setTimeout(() => {
        setFlash((c) => c + 1)
        navigator.vibrate?.(18)
      }, 660)
      setTimeout(() => setFlights((f) => f.filter((x) => x.key !== key)), 1500)
    }

    await supabase.rpc('update_preferences', {
      p_preferences: {
        ...preferences,
        scoops: balance + amount,
        quests: { daily: nextDaily, done: nextDone },
      },
    })
    await refreshProfile()
    setSaving(false)
  }

  return (
    <div className="isolate relative mx-auto max-w-md space-y-4 px-4 py-6">
      {/* gece göğü — menekşe bulutsu + yıldızlar */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(130% 70% at 50% 0%, #1c1140, #0d0921 52%, #070512 100%)',
        }}
      >
        {/* aurora ışıması */}
        <span
          className="absolute inset-x-0 top-0 h-[40%]"
          style={{ background: 'radial-gradient(55% 100% at 30% 0%, rgba(139,92,246,0.16), transparent 70%)' }}
        />
        <span
          className="absolute inset-x-0 top-0 h-[30%]"
          style={{ background: 'radial-gradient(45% 100% at 75% 0%, rgba(242,201,76,0.08), transparent 70%)' }}
        />
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              backgroundColor: s.gold ? GOLD : '#E4DDFF',
              boxShadow: `0 0 ${s.size * 2.5}px ${s.gold ? GOLD : '#C4B5FD'}`,
              animation: `quest-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              opacity: 0.15,
            }}
          />
        ))}
      </div>

      {/* plaka uçuşu — karttan kasaya kavisli yolculuk */}
      <div className="pointer-events-none fixed inset-0 z-50">
        {flights.map((f) =>
          Array.from({ length: f.n }).map((_, i) => (
            <motion.span
              key={`${f.key}-${i}`}
              className="absolute"
              style={{ left: f.from.x - 11, top: f.from.y - 11, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
              initial={{ x: 0, y: 0, scale: 0.35, rotate: 0, opacity: 0 }}
              animate={{
                x: [0, f.dx * 0.42 + (i - (f.n - 1) / 2) * 16, f.dx],
                y: [0, f.dy * 0.3 - 85 - i * 9, f.dy],
                scale: [0.35, 1.05, 0.4],
                rotate: [0, 200 + i * 45, 400 + i * 45],
                opacity: [0, 1, 1],
              }}
              transition={{ duration: 0.68, delay: i * 0.07, ease: [0.32, 0.08, 0.28, 1] }}
            >
              <PlateIcon size={22} />
            </motion.span>
          )),
        )}
      </div>

      <div className="flex items-center justify-between">
        <BackButton to="/ilerleme" label="İlerleme" />
        <span ref={balanceRef} className="relative inline-flex shrink-0">
          <motion.span
            key={flash}
            className="inline-flex"
            initial={false}
            animate={flash ? { scale: [1, 1.24, 0.96, 1] } : {}}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <PlateBalance value={balance} />
          </motion.span>
          {/* çarpma anı — altın şok halkası */}
          <AnimatePresence>
            {flash > 0 && (
              <motion.span
                key={`ring-${flash}`}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ border: `2px solid ${GOLD}`, boxShadow: `0 0 14px ${GOLD}66` }}
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </span>
      </div>

      {/* büyülü tabela */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pb-1 pt-1 text-center"
      >
        <div className="mx-auto flex max-w-[240px] items-center gap-3">
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${VIOLET_SOFT})` }} />
          <span style={{ color: VIOLET, fontSize: 10 }}>✦</span>
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${VIOLET_SOFT}, transparent)` }} />
        </div>
        <h1
          className="mt-3 text-[26px] font-bold uppercase leading-none tracking-[0.3em]"
          style={{
            backgroundImage: `linear-gradient(180deg, #F4EFFF 25%, #C4B5FD 60%, ${VIOLET})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textIndent: '0.3em',
            filter: 'drop-shadow(0 2px 12px rgba(139,92,246,0.35))',
          }}
        >
          Görevler
        </h1>
        <p className="mt-2 text-[10px] tracking-[0.2em]" style={{ color: MUTED }}>
          TAMAMLA · TOPLA · KUŞAN
        </p>
      </motion.div>

      <RuneDivider hint="Her gün yenilenir">Günlük</RuneDivider>
      <div className="space-y-2.5">
        {daily.map((q, i) => (
          <QuestCard key={q.id} quest={q} index={i} saving={saving} onCollect={collect} gain={gain} />
        ))}
      </div>

      <RuneDivider hint="Tamamlanınca yenilenir">Tekrarlanan</RuneDivider>
      <div className="space-y-2.5">
        {repeatables.map((q, i) => (
          <QuestCard key={q.id} quest={q} index={i} saving={saving} onCollect={collect} gain={gain} />
        ))}
      </div>

      <RuneDivider hint="Bir kez">Nişanlar</RuneDivider>
      <div className="space-y-2.5">
        {badges.map((q, i) => (
          <QuestCard key={q.id} quest={q} index={i} saving={saving} onCollect={collect} gain={gain} />
        ))}
      </div>

      <RuneDivider hint="5 → 500 gün">Seri Yolu</RuneDivider>
      <div
        className="relative overflow-hidden rounded-3xl border p-3.5"
        style={{
          borderColor: 'rgba(139,92,246,0.2)',
          background: 'linear-gradient(170deg, rgba(139,92,246,0.07), rgba(8,6,18,0.6) 60%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* patika omurgası — aydınlanan kısım altın, gerisi loş */}
        <span
          className="absolute bottom-6 top-6 w-[2px] rounded-full"
          style={{
            left: 31,
            background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD} ${Math.max(4, (litCount / trail.length) * 100)}%, rgba(139,92,246,0.22) ${Math.min(100, (litCount / trail.length) * 100 + 10)}%, rgba(139,92,246,0.1) 100%)`,
            boxShadow: litCount > 0 ? `0 0 8px ${GOLD}40` : 'none',
          }}
        />
        {trail.map((q, i) => (
          <TrailNode
            key={q.id}
            quest={q}
            index={i}
            isNext={i === nextIdx}
            saving={saving}
            onCollect={collect}
            gain={gain}
          />
        ))}
      </div>

      <p className="px-1 pt-1 text-center text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
        YENİ GÖREVLER YOLDA ✦
      </p>
    </div>
  )
}
