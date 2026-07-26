import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ACTIVITY_LEVELS, GOALS, computePlan, carbsForRemaining, maxSafeLossRate, calorieFloor } from '../lib/nutrition'
import MacroTuner from '../components/MacroTuner'
import PaceWarning, { SafeFloorNote } from '../components/PaceWarning'
import AuthLangSwitch from '../components/AuthLangSwitch'
import { t, getIntlLocale } from '../lib/i18n'

// Hesapsız (ilk giriş) akışında cevaplar tarayıcıda saklanır;
// kayıt tamamlanınca temizlenir.
const DRAFT_KEY = 'makrio-onboarding-draft'

const EMPTY_FORM = {
  name: '',
  age: '',
  // Cinsiyet önseçilmez: BMR formülü cinsiyete bağlı, yanlışlıkla geçilen
  // bir önseçim tüm planı yanlış temele oturtur.
  gender: '',
  height_cm: '',
  weight_kg: '',
  bodyFat: '',
  activity_level: 'moderate',
  goal: 'maintain',
  rate: 0.5,
  manualMacros: null,
}

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    return saved ? { ...EMPTY_FORM, ...saved } : EMPTY_FORM
  } catch {
    return EMPTY_FORM
  }
}

const GENDERS = [
  { value: 'female', label: 'Kadın', icon: '♀' },
  { value: 'male', label: 'Erkek', icon: '♂' },
]
const ACTIVITY_ICONS = { sedentary: '🪑', light: '🚶', moderate: '🏃', active: '🏋️', very_active: '🔥' }
const GOAL_ICONS = { lose: '📉', maintain: '⚖️', gain: '📈' }

function ChoiceCard({ active, onClick, icon, title, desc }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
        active ? 'border-accent bg-accent/10' : 'border-border bg-surface'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: active ? 'rgba(242,169,59,0.15)' : 'rgba(255,255,255,0.05)' }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${active ? 'text-accent' : 'text-text'}`}>{title}</span>
        {desc && <span className="block text-xs text-text-muted">{desc}</span>}
      </span>
    </motion.button>
  )
}

function NumberField({ label, value, onChange, unit, placeholder }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-text outline-none placeholder:text-text-muted/30"
        />
        <span className="text-sm text-text-muted">{unit}</span>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  // Hesapsız gelen ziyaretçi: sorular önce, hesap en sonda (mount anında sabitlenir).
  const [preAuth] = useState(() => !user)
  const totalSteps = preAuth ? 7 : 6

  // Profili zaten tamamlanmış kullanıcı buraya düşerse ana sayfaya dön —
  // yanlış yönlendirme soru ekranında bırakmasın.
  const alreadyOnboarded = Boolean(
    profile?.age && profile?.gender && profile?.weight_kg && profile?.height_cm && profile?.activity_level && profile?.goal,
  )
  useEffect(() => {
    if (alreadyOnboarded) navigate('/', { replace: true })
  }, [alreadyOnboarded, navigate])

  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [form, setForm] = useState(loadDraft)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // Cevaplar kaybolmasın: her değişiklikte taslağı sakla.
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  }, [form])

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const stepValid = {
    1: Boolean(form.gender),
    2: form.age && form.height_cm && form.weight_kg,
    3: true,
    4: Boolean(form.activity_level),
    5: Boolean(form.goal),
    6: true,
    7: email.includes('@') && password.length >= 6 && password === passwordConfirm,
  }

  const autoPlan =
    form.age && form.height_cm && form.weight_kg
      ? computePlan({
          gender: form.gender,
          weight_kg: Number(form.weight_kg),
          height_cm: Number(form.height_cm),
          age: Number(form.age),
          bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
          activity_level: form.activity_level,
          goal: form.goal,
          rate: Number(form.rate),
        })
      : null

  // Hız kaydırıcısının güvenli üst sınırı: günlük hedef kalori tabanının altına inemez.
  const rateCap = form.goal === 'lose' ? 1.4 : 1
  const rateMax =
    form.goal === 'lose' && autoPlan ? maxSafeLossRate({ tdee: autoPlan.tdee, gender: form.gender }) : rateCap
  const rateClamped = form.goal === 'lose' && rateMax < rateCap && Number(form.rate) >= rateMax

  // Kalori hedefi sabittir (hıza göre). Elle ayar sadece protein & yağı değiştirir,
  // karbonhidrat kalan kaloriyi doldurur.
  const effCalories = autoPlan?.calories
  const effProtein = form.manualMacros ? form.manualMacros.protein_g : autoPlan?.macros.protein_g
  const effFat = form.manualMacros ? form.manualMacros.fat_g : autoPlan?.macros.fat_g
  const effMacros = autoPlan
    ? { protein_g: effProtein, fat_g: effFat, carbs_g: carbsForRemaining(effCalories, effProtein, effFat) }
    : null
  const computedGoals = autoPlan
    ? { calories: effCalories, protein_g: effMacros.protein_g, carbs_g: effMacros.carbs_g, fat_g: effMacros.fat_g }
    : null

  function setMacro(key, val) {
    if (!autoPlan) return
    const base = form.manualMacros ?? { protein_g: autoPlan.macros.protein_g, fat_g: autoPlan.macros.fat_g }
    update('manualMacros', { ...base, [key]: val })
  }

  function goNext() {
    setDir(1)
    setStep((s) => Math.min(totalSteps, s + 1))
  }
  function goBack() {
    setDir(-1)
    setStep((s) => Math.max(1, s - 1))
  }

  async function saveProfileAndGoals(userId, currentPrefs) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: form.name || null,
        age: Number(form.age),
        gender: form.gender,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        activity_level: form.activity_level,
        goal: form.goal,
      })
      .eq('id', userId)

    if (profileError) return t('Profil kaydedilemedi, tekrar dene.')

    // preferences kolonu RLS nedeniyle doğrudan update edilemiyor; RPC ile yazılır.
    const nextPrefs = { ...(currentPrefs ?? {}) }
    if (form.bodyFat) nextPrefs.bodyFat = Number(form.bodyFat)
    if (form.goal !== 'maintain') nextPrefs.goalRate = Math.min(Number(form.rate), rateMax)
    if (form.bodyFat || form.goal !== 'maintain') {
      await supabase.rpc('update_preferences', { p_preferences: nextPrefs })
    }

    const { error: goalsError } = await supabase
      .from('user_goals')
      .upsert(
        {
          user_id: userId,
          calories: computedGoals.calories,
          protein_g: computedGoals.protein_g,
          carbs_g: computedGoals.carbs_g,
          fat_g: computedGoals.fat_g,
        },
        { onConflict: 'user_id' },
      )

    if (goalsError) return t('Hedefler kaydedilemedi, tekrar dene.')
    return null
  }

  async function handleConfirm() {
    if (!computedGoals) return
    setSaving(true)
    setError('')
    setInfo('')

    // Hesapsız akış: önce hesabı oluştur, ardından cevapları kaydet.
    if (preAuth) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setSaving(false)
        setError(
          signUpError.message === 'User already registered'
            ? t('Bu e-posta zaten kayıtlı. Alttaki bağlantıdan giriş yapabilirsin.')
            : t('Hesap oluşturulamadı, tekrar dene.'),
        )
        return
      }

      // E-posta onayı gerekiyorsa cevaplar taslakta bekler; girişten sonra kaldığı yerden devam eder.
      if (!data.session) {
        setSaving(false)
        setInfo(t('Hesabını onaylamak için e-postanı kontrol et. Onayladıktan sonra giriş yap — cevapların kayıtlı, seni bekliyor.'))
        return
      }

      const err = await saveProfileAndGoals(data.user.id, {})
      setSaving(false)
      if (err) {
        setError(err)
        return
      }
      localStorage.removeItem(DRAFT_KEY)
      await refreshProfile(data.user.id)
      navigate('/')
      return
    }

    if (!user) return
    const err = await saveProfileAndGoals(user.id, profile?.preferences)
    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    localStorage.removeItem(DRAFT_KEY)
    await refreshProfile()
    navigate('/')
  }

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-5 py-8">
      {/* marka + giriş (yalnızca hesapsız akışta) */}
      {preAuth && (
        <div className="mb-5 flex items-center justify-between gap-2">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Makrio</span>
          <div className="flex items-center gap-2">
            {/* Dil seçici — yabancı kullanıcı kayıt akışını anlayabilsin */}
            <AuthLangSwitch />
            <Link to="/giris" className="btn-chip whitespace-nowrap text-sm text-text-muted">
              {/* Dar ekranda soru gizlenir — satır kırılmasın, yalnız "Giriş yap" kalsın */}
              <span className="hidden min-[430px]:inline">{t('Zaten üye misin? ')}</span>
              <span className="font-medium text-text">{t('Giriş yap')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* progress */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={false}
                animate={{ width: i + 1 <= step ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
        <span className="text-xs tabular-nums text-text-muted">
          {step}/{totalSteps}
        </span>
      </div>

      <div className="relative flex-1 pt-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Merhaba 👋')}</h1>
                  <p className="mt-1 text-sm text-text-muted">{t('Seni biraz tanıyalım.')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                  <div className="text-xs text-text-muted">{t('Adın (opsiyonel)')}</div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Eren"
                    className="mt-1 w-full bg-transparent text-lg text-text outline-none placeholder:text-text-muted/30"
                  />
                </div>
                <div>
                  <div className="mb-2 text-sm text-text-muted">{t('Cinsiyet')}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {GENDERS.map((g) => (
                      <ChoiceCard
                        key={g.value}
                        active={form.gender === g.value}
                        onClick={() => update('gender', g.value)}
                        icon={g.icon}
                        title={t(g.label)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Vücut ölçülerin')}</h1>
                  <p className="mt-1 text-sm text-text-muted">{t('Hedeflerini doğru hesaplamak için.')}</p>
                </div>
                <NumberField label={t('Yaş')} value={form.age} onChange={(v) => update('age', v)} unit={t('yaş')} placeholder="28" />
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label={t('Boy')} value={form.height_cm} onChange={(v) => update('height_cm', v)} unit="cm" placeholder="175" />
                  <NumberField label={t('Kilo')} value={form.weight_kg} onChange={(v) => update('weight_kg', v)} unit="kg" placeholder="75" />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Vücut yağ oranın')}</h1>
                  <p className="mt-1 text-sm text-text-muted">
                    {t('Biliyorsan girebilirsin — bazal metabolizmanı çok daha hassas hesaplarız. Bilmiyorsan atla.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="text-center">
                    <span className="text-4xl font-bold tabular-nums text-text">{form.bodyFat || '—'}</span>
                    {form.bodyFat && <span className="text-lg text-text-muted">%</span>}
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={form.bodyFat || 20}
                    onChange={(e) => update('bodyFat', e.target.value)}
                    className="mt-4 w-full accent-[color:var(--color-accent)]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                    <span>%5</span>
                    <span>%50</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    update('bodyFat', '')
                    goNext()
                  }}
                  className="btn-chip w-full text-center text-sm text-text-muted"
                >
                  {t('Emin değilim, atla →')}
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Aktivite seviyen')}</h1>
                  <p className="mt-1 text-sm text-text-muted">{t('Günlük hareketliliğin ne kadar?')}</p>
                </div>
                <div className="space-y-2.5">
                  {ACTIVITY_LEVELS.map((a) => (
                    <ChoiceCard
                      key={a.value}
                      active={form.activity_level === a.value}
                      onClick={() => update('activity_level', a.value)}
                      icon={ACTIVITY_ICONS[a.value]}
                      title={t(a.label)}
                      desc={t(a.description)}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Hedefin ne?')}</h1>
                  <p className="mt-1 text-sm text-text-muted">{t('Sonra istediğin zaman değiştirebilirsin.')}</p>
                </div>
                <div className="space-y-2.5">
                  {GOALS.map((g) => (
                    <ChoiceCard
                      key={g.value}
                      active={form.goal === g.value}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          goal: g.value,
                          manualMacros: null,
                          // 1 kg/hafta üzeri yalnızca kilo vermede seçilebilir.
                          rate: g.value === 'lose' ? f.rate : Math.min(f.rate, 1),
                        }))
                      }
                      icon={GOAL_ICONS[g.value]}
                      title={t(g.label)}
                      desc={t(g.description)}
                    />
                  ))}
                </div>

                {form.goal !== 'maintain' && (
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-text-muted">
                        {t('Haftalık {kind} hızın', { kind: form.goal === 'lose' ? t('verme') : t('alma') })}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-text">
                        {Number(form.rate).toLocaleString(getIntlLocale())} {t('kg/hafta')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max={rateMax}
                      step="0.05"
                      value={Math.min(Number(form.rate), rateMax)}
                      onChange={(e) => setForm((f) => ({ ...f, rate: Number(e.target.value), manualMacros: null }))}
                      className="w-full accent-[color:var(--color-accent)]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                      <span>{t('yavaş & sürdürülebilir')}</span>
                      <span>{t('hızlı')}</span>
                    </div>
                    <PaceWarning show={form.goal === 'lose' && Math.min(Number(form.rate), rateMax) >= 1} />
                    <SafeFloorNote show={rateClamped} floor={calorieFloor(form.gender)} />
                    {autoPlan && (
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-text-muted">{t('Bu hızla günlük hedef')}</span>
                        <span className="text-sm font-bold tabular-nums text-text">
                          {autoPlan.calories} <span className="text-xs font-normal text-text-muted">kcal</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {step === 6 && computedGoals && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Hazırsın! 🎯')}</h1>
                  <p className="mt-1 text-sm text-text-muted">
                    {form.bodyFat
                      ? t('Vücut yağ oranınla (Katch-McArdle) hassas hesaplandı.')
                      : t('Mifflin-St Jeor formülüyle hesaplandı.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5 text-center">
                  <div className="text-xs text-text-muted">{t('Günlük kalori hedefin')}</div>
                  <div className="mt-0.5 text-4xl font-bold tabular-nums text-text">{computedGoals.calories}</div>
                  <div className="text-xs text-text-muted">kcal</div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text">{t('Makrolar')}</span>
                    <span className="text-xs text-text-muted">
                      {form.manualMacros ? t('Elle ayarlandı') : t('İstersen elle ayarla')}
                    </span>
                  </div>
                  <MacroTuner
                    calories={effCalories}
                    macros={effMacros}
                    manual={!!form.manualMacros}
                    onSet={setMacro}
                    onReset={() => update('manualMacros', null)}
                  />
                </div>
                {!preAuth && error && <p className="text-sm text-red-400">{error}</p>}
              </>
            )}

            {step === 7 && preAuth && (
              <>
                <div>
                  <h1 className="text-3xl font-semibold text-text">{t('Son adım 🎉')}</h1>
                  <p className="mt-1 text-sm text-text-muted">
                    {t('Planın hazır — kaydetmek için bir hesap yeter.')}
                  </p>
                </div>

                {computedGoals && (
                  <div className="flex items-center justify-between rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3">
                    <span className="text-sm text-text-muted">{t('Günlük hedefin')}</span>
                    <span className="text-lg font-bold tabular-nums text-text">
                      {computedGoals.calories} <span className="text-sm font-normal text-text-muted">kcal</span>
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    <div className="text-xs text-text-muted">{t('E-posta')}</div>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('sen@ornek.com')}
                      className="mt-1 w-full bg-transparent text-lg text-text outline-none placeholder:text-text-muted/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                      <div className="text-xs text-text-muted">{t('Şifre')}</div>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="mt-1 w-full bg-transparent text-lg text-text outline-none placeholder:text-text-muted/30"
                      />
                    </div>
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                      <div className="text-xs text-text-muted">{t('Şifre (tekrar)')}</div>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••"
                        className="mt-1 w-full bg-transparent text-lg text-text outline-none placeholder:text-text-muted/30"
                      />
                    </div>
                  </div>
                  {password && passwordConfirm && password !== passwordConfirm && (
                    <p className="text-xs text-red-400">{t('Şifreler eşleşmiyor.')}</p>
                  )}
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}
                {info && <p className="text-sm text-accent">{info}</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* nav */}
      <div className="flex gap-2 pt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="btn-chip inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 font-medium text-text-muted"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M14.5 5.5 8 12l6.5 6.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('Geri')}
          </button>
        )}
        {step < totalSteps ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={!stepValid[step]}
            onClick={goNext}
            className="btn-primary flex-1 rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-40"
          >
            {t('Devam')}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={saving || !stepValid[step]}
            onClick={handleConfirm}
            className="btn-primary flex-1 rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving
              ? preAuth
                ? t('Hesap oluşturuluyor...')
                : t('Kaydediliyor...')
              : preAuth
                ? t('Hesabımı oluştur ve başla')
                : t('Başla')}
          </motion.button>
        )}
      </div>
    </div>
  )
}
