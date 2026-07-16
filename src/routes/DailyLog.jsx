import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, formatHeaderDate, addDays } from '../lib/date'
import { computeMacrosForAmount } from '../lib/foodMath'
import { emptyRecipeDraft, recipeTotals, recipeMacrosForServings } from '../lib/recipes'
import { MEAL_TYPES, getMealTypeLabel, canonicalMealType, defaultMealType } from '../lib/mealTypes'
import { Skeleton } from '../components/SkeletonLoader'
import MealPeriodIcon from '../components/MealPeriodIcon'
import StarIcon from '../components/StarIcon'
import BackButton from '../components/BackButton'
import { PixelFoodIcon, hasPixelFoodIcon, PixelFlame } from '../components/pixelSprites'
import StreakCelebration from '../components/StreakCelebration'
import SwipeableLogRow from '../components/SwipeableLogRow'
import SupplementTracker from '../components/SupplementTracker'
import { useSmoothNumber } from '../hooks/useSmoothNumber'
import GoldGate from '../components/GoldGate'
import BarcodeScanner from '../components/BarcodeScanner'
import ScanResult from '../components/ScanResult'
import { isGold, FREE_LOG_LIMIT } from '../lib/gold'
import { scoreFood } from '../lib/foodScore'
import FoodReportCard from '../components/FoodReportCard'
import KarneSheet from '../components/KarneSheet'

// Aktif ("Şimdi") öğün ikonu için gün zamanına özel renk.
const NOW_COLORS = {
  morning: '#FDE68A', // açık sarı
  noon: '#EAB308', // hafif koyu sarı
  evening: '#3B82F6', // daha az koyu mavi
  night: '#3355C9', // koyu mavi (okunaklı)
}

// Açık temalarda (light/pixel) sarılar krem zeminde kaybolmasın diye koyulaştırılır.
const NOW_COLORS_LIGHT = {
  morning: '#E0A80C',
  noon: '#B7790B',
}

// Aranan kelimeyi sonuç adında vurgular (Türkçe büyük/küçük harf duyarlı).
function highlightMatch(name, q) {
  const query = q.trim()
  if (query.length < 2) return name
  const idx = name.toLocaleLowerCase('tr').indexOf(query.toLocaleLowerCase('tr'))
  if (idx === -1) return name
  return (
    <>
      {name.slice(0, idx)}
      <span className="font-semibold text-white">{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  )
}

const MACRO_DOTS = [
  { key: 'protein_per_100g', suffix: 'P', color: '#FF8A5B' },
  { key: 'fat_per_100g', suffix: 'Y', color: '#F2C94C' },
  { key: 'carbs_per_100g', suffix: 'K', color: '#6FCF97' },
]

// Sonuç satırındaki hızlı ekleme butonu: + → yükleniyor → ✓
function QuickAddButton({ state, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'saving'}
      aria-label="Hızlı ekle"
      className={`btn-icon relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition-colors ${
        state === 'done' ? 'border-white bg-white text-black' : 'border-white/[0.12] text-text'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'done' ? (
          <motion.svg
            key="check"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            <path d="M4.5 12.5l5 5 10-11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        ) : state === 'saving' ? (
          <motion.span
            key="spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-4 w-4 animate-spin rounded-full border-[1.8px] border-white/25 border-t-white"
          />
        ) : (
          <motion.span
            key="plus"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="leading-none"
          >
            +
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function NutritionPreview({ preview, macroFields }) {
  const calories = useSmoothNumber(preview.calories)

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
      <div className="flex flex-col items-center">
        <span className="text-5xl font-bold tabular-nums tracking-tight text-text">{Math.round(calories)}</span>
        <span className="mt-1 text-sm text-text-muted">kcal</span>
      </div>

      <div className="mt-5 grid grid-cols-3 border-t border-white/[0.06] pt-4">
        {macroFields.map((m, i) => (
          <MacroFieldValue key={m.key} preview={preview} field={m} divider={i > 0} />
        ))}
      </div>
    </div>
  )
}

function MacroFieldValue({ preview, field, divider }) {
  const value = useSmoothNumber(preview[field.key])

  return (
    <div className={`flex flex-col items-center gap-1 ${divider ? 'border-l border-white/[0.06]' : ''}`}>
      <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: field.color }} />
        {field.label}
      </span>
      <span className="text-base font-semibold tabular-nums text-text">{Math.round(value)}g</span>
    </div>
  )
}

export default function DailyLog() {
  const { user, profile, refreshProfile } = useAuth()
  const today = todayStr()
  const recipes = profile?.preferences?.recipes ?? []

  // Görüntülenen gün — geçmiş günleri de görüntülemek/düzenlemek için.
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const lightUi = ['light', 'pixel', 'pixel-color'].includes(profile?.preferences?.theme)
  const pixelUi = String(profile?.preferences?.theme ?? '').startsWith('pixel')
  // Piksel temada dolum animasyonu kademeli (8-bit) aksın.
  const barEase = pixelUi ? (t) => Math.floor(t * 7) / 7 : [0.34, 1.1, 0.64, 1]

  const [view, setView] = useState('overview')
  const [activeMeal, setActiveMeal] = useState('morning')

  const [logs, setLogs] = useState([])
  const [goalCalories, setGoalCalories] = useState(null)
  const [goalProtein, setGoalProtein] = useState(0)
  const [goalCarbs, setGoalCarbs] = useState(0)
  const [goalFat, setGoalFat] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)

  const [tab, setTab] = useState('recent')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [quickState, setQuickState] = useState({}) // foodId → 'saving' | 'done'
  const [searchError, setSearchError] = useState('')

  const [selectedFood, setSelectedFood] = useState(null)
  const [amount, setAmount] = useState(100)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  // Tarifler (MacroFactor tarzı) — preferences.recipes içinde saklanır.
  const [recipeDraft, setRecipeDraft] = useState(null) // { id, name, servings, items }
  const [addingIngredient, setAddingIngredient] = useState(false)
  const [recipeDetail, setRecipeDetail] = useState(null) // görüntülenen kayıtlı tarif
  const [logServings, setLogServings] = useState(1)
  const [recipeSaving, setRecipeSaving] = useState(false)
  const [recipeError, setRecipeError] = useState('')

  // Günün ilk kaydında seri kutlaması.
  const [celebration, setCelebration] = useState(null) // { streak }

  const [creatingCustom, setCreatingCustom] = useState(false)
  const [customForm, setCustomForm] = useState({ name_tr: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '' })
  const [customError, setCustomError] = useState('')
  const [customSaving, setCustomSaving] = useState(false)
  // Ücretsiz plan: günlük kayıt limiti dolunca Gold daveti açılır.
  const [goldGate, setGoldGate] = useState(false)
  const gold = isGold(profile)

  // Barkod tarama: DB → Open Food Facts → manuel form (barkod ekli).
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null) // { phase, code, food? }
  const [karneFood, setKarneFood] = useState(null) // ⓘ ile açılan Besin Karnesi sayfası
  const [customBarcode, setCustomBarcode] = useState(null)
  const [customBrand, setCustomBrand] = useState('')

  // Seriyi güncelle; bugünün İLK kaydıysa kutlama animasyonunu tetikle.
  async function bumpStreak() {
    const wasFirstToday = (profile?.last_log_date ?? null) !== today
    await supabase.rpc('update_streak')
    if (wasFirstToday) {
      const { data } = await supabase.from('profiles').select('current_streak').eq('id', user.id).single()
      if (data?.current_streak) setCelebration({ streak: data.current_streak })
    }
    refreshProfile()
  }

  async function loadLogs() {
    setLogsLoading(true)
    const [{ data: logsData }, { data: goals }] = await Promise.all([
      supabase
        .from('food_logs')
        .select('id, meal_type, food_name, amount_g, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('user_goals')
        .select('calories, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1),
    ])
    setLogs(logsData ?? [])
    setGoalCalories(goals?.[0]?.calories ?? null)
    setGoalProtein(goals?.[0]?.protein_g ?? 0)
    setGoalCarbs(goals?.[0]?.carbs_g ?? 0)
    setGoalFat(goals?.[0]?.fat_g ?? 0)
    setLogsLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [user.id, selectedDate])

  useEffect(() => {
    supabase
      .from('favorites')
      .select('food_id')
      .eq('user_id', user.id)
      .then(({ data }) => setFavoriteIds(new Set((data ?? []).map((f) => f.food_id))))
  }, [user.id])

  useEffect(() => {
    // Yemek araması: normal arama ekranında (Tarifler sekmesi hariç) veya
    // tarife malzeme eklerken çalışır.
    const foodSearchMode = (view === 'search' && tab !== 'recipes') || addingIngredient
    if (!foodSearchMode) return
    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      let data = []
      if (query.trim().length >= 2) {
        const res = await supabase.rpc('search_foods', { p_query: query.trim() })
        data = res.data ?? []
      } else if (addingIngredient || tab === 'recent') {
        const res = await supabase.rpc('recent_foods')
        data = res.data ?? []
      } else {
        const ids = Array.from(favoriteIds)
        if (ids.length > 0) {
          const res = await supabase.from('foods').select('*').in('id', ids)
          data = res.data ?? []
        }
      }
      if (!cancelled) {
        setResults(data)
        setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, tab, favoriteIds, view, addingIngredient])

  async function toggleFavorite(foodId) {
    const next = new Set(favoriteIds)
    if (next.has(foodId)) {
      next.delete(foodId)
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('food_id', foodId)
    } else {
      next.add(foodId)
      await supabase.from('favorites').insert({ user_id: user.id, food_id: foodId })
    }
    setFavoriteIds(next)
  }

  function openMeal(value) {
    setActiveMeal(value)
    setQuery('')
    setTab('recent')
    setSearchError('')
    setQuickState({})
    setView('search')
  }

  // Tek dokunuşla ekleme: yemeği görünen porsiyonuyla (100g / varsayılan) anında kaydeder,
  // kullanıcı arama ekranında kalıp eklemeye devam edebilir.
  // Ücretsiz plan: seçili günde limit dolduysa eklemeden önce Gold daveti aç.
  function hitFreeLimit() {
    if (gold || logs.length < FREE_LOG_LIMIT) return false
    setGoldGate(true)
    return true
  }

  async function quickAdd(food) {
    if (quickState[food.id]) return
    if (hitFreeLimit()) return
    setSearchError('')
    setQuickState((s) => ({ ...s, [food.id]: 'saving' }))

    const clear = () =>
      setQuickState((s) => {
        const next = { ...s }
        delete next[food.id]
        return next
      })

    const { data: canAdd } = await supabase.rpc('can_add_food_log', { p_date: selectedDate })
    if (canAdd === false) {
      clear()
      setGoldGate(true)
      return
    }

    const amt = food.default_serving_g || 100
    const { error: insertError } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: selectedDate,
      meal_type: activeMeal,
      food_id: food.id,
      food_name: food.name_tr,
      amount_g: amt,
      ...computeMacrosForAmount(food, amt),
    })

    if (insertError) {
      clear()
      setSearchError('Eklenemedi, tekrar dene.')
      return
    }

    if (isToday) bumpStreak()
    navigator.vibrate?.(12)
    setQuickState((s) => ({ ...s, [food.id]: 'done' }))
    loadLogs()
    setTimeout(clear, 1500)
  }

  // Boş arama sonucunda aranan adla önceden doldurulmuş özel yemek formu aç.
  function openCustomFood() {
    setCustomForm((f) => ({ ...f, name_tr: query.trim() }))
    setCustomBarcode(null)
    setCustomBrand('')
    setCustomError('')
    setCreatingCustom(true)
  }

  // Okunan barkodu çözümle: önce kendi veritabanı, sonra Open Food Facts,
  // o da yoksa premium "ilk sen tanımla" kartı. Bulunanlar onay
  // animasyonuyla (ScanResult) gram ekranına akar.
  async function handleBarcode(code) {
    setScanning(false)
    setScanResult({ phase: 'lookup', code })
    setSearchError('')

    // 1) Kendi veritabanımız
    const { data: own } = await supabase.from('foods').select('*').eq('barcode', code).limit(1)
    if (own?.[0]) {
      setScanResult({ phase: 'found', code, food: own[0] })
      return
    }

    // 2) Open Food Facts (açık gıda veritabanı)
    let product = null
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_tr,brands,nutriments,serving_quantity`,
      )
      const json = await res.json()
      if (json?.status === 1) product = json.product
    } catch {
      /* ağ hatası — manuel forma düş */
    }

    const n = product?.nutriments
    if (product && n && n['energy-kcal_100g'] != null) {
      // Bulundu: ürünü barkoduyla kaydet, doğrudan gram ekranını aç.
      const name = (product.product_name_tr || product.product_name || '').trim().slice(0, 80) || `Ürün ${code}`
      const brand = (product.brands || '').split(',')[0].trim() || null
      const { data: nameSearch } = await supabase.rpc('normalize_tr', { input: name })
      const { data: created, error } = await supabase
        .from('foods')
        .insert({
          name_tr: name,
          name_search: nameSearch ?? name.toLowerCase(),
          brand,
          barcode: code,
          calories_per_100g: Math.round(n['energy-kcal_100g']) || 0,
          protein_per_100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
          carbs_per_100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
          fat_per_100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
          default_serving_g: Math.round(Number(product.serving_quantity)) || null,
          created_by: user.id,
          is_verified: false,
        })
        .select()
        .single()
      if (!error && created) {
        navigator.vibrate?.([12, 30, 16])
        setScanResult({ phase: 'found', code, food: created })
        return
      }
    }

    // 3) Bulunamadı: premium kart — oradan barkod ekli manuel forma geçilir.
    setScanResult({ phase: 'notfound', code })
  }

  // "Etiketten Tanımla": barkod ekli özel yemek formunu aç.
  function defineFromBarcode(code) {
    setScanResult(null)
    setCustomForm({ name_tr: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '' })
    setCustomBarcode(code)
    setCustomBrand('')
    setCustomError('')
    setCreatingCustom(true)
  }

  function backToOverview() {
    setSelectedFood(null)
    setEditingId(null)
    setSaved(false)
    setError('')
    setCreatingCustom(false)
    setRecipeDraft(null)
    setRecipeDetail(null)
    setAddingIngredient(false)
    setView('overview')
  }

  // ---- Tarifler ----

  // Bir yemek + gramajdan tarif malzemesi üretir (per-100g değerleri de saklanır
  // ki gramaj değişince yeniden hesaplanabilsin).
  function recipeItemFromFood(food, amount_g) {
    return {
      food_id: food.id,
      food_name: food.name_tr,
      amount_g,
      ...computeMacrosForAmount(food, amount_g),
      cal100: food.calories_per_100g,
      p100: food.protein_per_100g,
      c100: food.carbs_per_100g,
      f100: food.fat_per_100g,
    }
  }

  function recomputeItem(item, amount_g) {
    const src = {
      calories_per_100g: item.cal100 ?? 0,
      protein_per_100g: item.p100 ?? 0,
      carbs_per_100g: item.c100 ?? 0,
      fat_per_100g: item.f100 ?? 0,
    }
    return { ...item, amount_g, ...computeMacrosForAmount(src, amount_g) }
  }

  async function persistRecipes(next) {
    setRecipeSaving(true)
    await supabase.rpc('update_preferences', {
      p_preferences: { ...(profile?.preferences ?? {}), recipes: next },
    })
    await refreshProfile()
    setRecipeSaving(false)
  }

  function startNewRecipe() {
    setRecipeDraft(emptyRecipeDraft())
    setRecipeError('')
    setView('recipeBuilder')
  }

  function editRecipe(recipe) {
    setRecipeDraft({ ...recipe, items: recipe.items.map((it) => ({ ...it })) })
    setRecipeError('')
    setRecipeDetail(null)
    setView('recipeBuilder')
  }

  function openIngredientSearch() {
    setQuery('')
    setSearchError('')
    setAddingIngredient(true)
  }

  function addIngredient(food) {
    const amt = food.default_serving_g || 100
    setRecipeDraft((d) => ({ ...d, items: [...d.items, recipeItemFromFood(food, amt)] }))
    setAddingIngredient(false)
    setQuery('')
  }

  function setIngredientAmount(index, amount_g) {
    setRecipeDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? recomputeItem(it, amount_g) : it)),
    }))
  }

  function removeIngredient(index) {
    setRecipeDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }))
  }

  async function saveRecipeDraft() {
    if (!recipeDraft) return
    if (!recipeDraft.name.trim()) {
      setRecipeError('Tarife bir isim ver.')
      return
    }
    if (recipeDraft.items.length === 0) {
      setRecipeError('En az bir malzeme ekle.')
      return
    }
    const clean = { ...recipeDraft, name: recipeDraft.name.trim(), servings: Math.max(1, Number(recipeDraft.servings) || 1) }
    const exists = recipes.some((r) => r.id === clean.id)
    const next = exists ? recipes.map((r) => (r.id === clean.id ? clean : r)) : [...recipes, { ...clean, createdAt: new Date().toISOString() }]
    await persistRecipes(next)
    setRecipeDraft(null)
    setTab('recipes')
    setView('search')
  }

  async function deleteRecipe(id) {
    await persistRecipes(recipes.filter((r) => r.id !== id))
    setRecipeDetail(null)
    setTab('recipes')
    setView('search')
  }

  function openRecipeDetail(recipe) {
    setRecipeDetail(recipe)
    setLogServings(1)
    setRecipeError('')
    setView('recipeDetail')
  }

  async function logRecipe() {
    if (!recipeDetail) return
    if (hitFreeLimit()) return
    setRecipeSaving(true)
    setRecipeError('')

    const { data: canAdd } = await supabase.rpc('can_add_food_log', { p_date: selectedDate })
    if (canAdd === false) {
      setRecipeSaving(false)
      setGoldGate(true)
      return
    }

    const m = recipeMacrosForServings(recipeDetail, Number(logServings) || 1)
    const label =
      Number(logServings) === 1 ? recipeDetail.name : `${recipeDetail.name} (${logServings} porsiyon)`
    const { error: insertError } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: selectedDate,
      meal_type: activeMeal,
      food_id: null,
      food_name: label,
      amount_g: m.amount_g,
      calories: m.calories,
      protein_g: m.protein_g,
      carbs_g: m.carbs_g,
      fat_g: m.fat_g,
    })

    setRecipeSaving(false)
    if (insertError) {
      setRecipeError('Eklenemedi, tekrar dene.')
      return
    }
    if (isToday) await bumpStreak()
    navigator.vibrate?.(12)
    await loadLogs()
    backToOverview()
  }

  function selectFood(food) {
    setSelectedFood(food)
    setEditingId(null)
    setAmount(food.default_serving_g || 100)
    setError('')
    setView('detail')
  }

  // Eklenmiş bir yemek log'una basınca aynı gram arayüzünü düzenleme modunda aç.
  // Log yüzde-100 makro tutmadığı için mevcut miktardan geri türetiyoruz.
  function startEdit(log) {
    const amt = log.amount_g || 100
    const per = (v) => (amt ? ((v ?? 0) / amt) * 100 : 0)
    setSelectedFood({
      id: log.food_id,
      name_tr: log.food_name,
      calories_per_100g: Math.round(per(log.calories)),
      protein_per_100g: Math.round(per(log.protein_g) * 10) / 10,
      fat_per_100g: Math.round(per(log.fat_g) * 10) / 10,
      carbs_per_100g: Math.round(per(log.carbs_g) * 10) / 10,
    })
    setActiveMeal(canonicalMealType(log.meal_type))
    setEditingId(log.id)
    setAmount(String(amt))
    setSaved(false)
    setError('')
    setView('detail')
  }

  async function handleAdd() {
    if (!selectedFood || !amount || saved) return
    if (!editingId && hitFreeLimit()) return
    setSubmitting(true)
    setError('')

    const macros = computeMacrosForAmount(selectedFood, Number(amount))

    if (editingId) {
      const { error: updateError } = await supabase
        .from('food_logs')
        .update({ meal_type: activeMeal, amount_g: Number(amount), ...macros })
        .eq('id', editingId)

      setSubmitting(false)
      if (updateError) {
        setError('Güncellenemedi, tekrar dene.')
        return
      }
      setSaved(true)
      navigator.vibrate?.(12)
      await loadLogs()
      setTimeout(backToOverview, 650)
      return
    }

    const { data: canAdd } = await supabase.rpc('can_add_food_log', { p_date: selectedDate })
    if (canAdd === false) {
      setSubmitting(false)
      setGoldGate(true)
      return
    }

    const { error: insertError } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: selectedDate,
      meal_type: activeMeal,
      food_id: selectedFood.id,
      food_name: selectedFood.name_tr,
      amount_g: Number(amount),
      ...macros,
    })

    setSubmitting(false)
    if (insertError) {
      setError('Eklenemedi, tekrar dene.')
      return
    }

    if (isToday) await bumpStreak()

    setSaved(true)
    navigator.vibrate?.(12)
    await loadLogs()
    setTimeout(backToOverview, 650)
  }

  async function handleDelete(id) {
    setLogs((prev) => prev.filter((l) => l.id !== id))
    await supabase.from('food_logs').delete().eq('id', id)
  }

  async function handleCreateCustom(e) {
    e.preventDefault()
    setCustomError('')

    const { name_tr, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g } = customForm
    if (!name_tr || !calories_per_100g) {
      setCustomError('İsim ve kalori zorunlu.')
      return
    }

    setCustomSaving(true)
    const { data: nameSearch } = await supabase.rpc('normalize_tr', { input: name_tr })

    const { data: created, error: createError } = await supabase
      .from('foods')
      .insert({
        name_tr,
        name_search: nameSearch ?? name_tr.toLowerCase(),
        barcode: customBarcode,
        brand: customBrand.trim() || null,
        calories_per_100g: Number(calories_per_100g) || 0,
        protein_per_100g: Number(protein_per_100g) || 0,
        carbs_per_100g: Number(carbs_per_100g) || 0,
        fat_per_100g: Number(fat_per_100g) || 0,
        created_by: user.id,
        is_verified: false,
      })
      .select()
      .single()

    setCustomSaving(false)
    if (createError) {
      setCustomError('Kaydedilemedi, tekrar dene.')
      return
    }

    setCreatingCustom(false)
    setCustomForm({ name_tr: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '' })
    setCustomBarcode(null)
    setCustomBrand('')
    selectFood(created)
  }

  const preview = selectedFood ? computeMacrosForAmount(selectedFood, Number(amount) || 0) : null
  const activeMealMeta = MEAL_TYPES.find((m) => m.value === activeMeal)

  // Her görünümde üstte yüzen seri kutlaması + Gold daveti (fixed konumlu).
  const celebrationEl = (
    <>
      <AnimatePresence>
        {celebration && (
          <StreakCelebration streak={celebration.streak} onClose={() => setCelebration(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>{goldGate && <GoldGate onClose={() => setGoldGate(false)} />}</AnimatePresence>
      <AnimatePresence>
        {scanning && <BarcodeScanner onDetect={handleBarcode} onClose={() => setScanning(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {scanResult && (
          <ScanResult
            result={scanResult}
            onUse={(food) => {
              setScanResult(null)
              navigator.vibrate?.(10)
              selectFood(food)
            }}
            onDefine={() => defineFromBarcode(scanResult.code)}
            onRescan={() => {
              setScanResult(null)
              setScanning(true)
            }}
            onClose={() => setScanResult(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {karneFood && <KarneSheet food={karneFood} onClose={() => setKarneFood(null)} />}
      </AnimatePresence>
    </>
  )

  if (creatingCustom) {
    const macroInputs = [
      { key: 'protein_per_100g', label: 'Protein', color: '#FF8A5B' },
      { key: 'fat_per_100g', label: 'Yağ', color: '#F2C94C' },
      { key: 'carbs_per_100g', label: 'Karb', color: '#6FCF97' },
    ]
    const macroKcal = Math.round(
      (Number(customForm.protein_per_100g) || 0) * 4 +
        (Number(customForm.carbs_per_100g) || 0) * 4 +
        (Number(customForm.fat_per_100g) || 0) * 9,
    )
    const kcalMismatch =
      macroKcal > 0 && Number(customForm.calories_per_100g) > 0 && macroKcal !== Number(customForm.calories_per_100g)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md space-y-4 px-4 py-6"
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={() => setCreatingCustom(false)} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
            <MealPeriodIcon type={activeMeal} color="var(--icon-muted)" size={14} />
            {activeMealMeta?.label}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {customBarcode ? 'Yeni Ürün Tanımla' : 'Özel Yemek Ekle'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {customBarcode
              ? 'Etiketteki değerleri gir — bu ürünü ilk sen tanımlıyorsun.'
              : 'Bir kez kaydet, sonra aramadan tek dokunuşla ekle.'}
          </p>
        </div>

        {/* canlı önizleme — yazdıkça dolan vitrin kartı */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/[0.07] px-5 pb-5 pt-4 text-center"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 45%), radial-gradient(110% 90% at 50% 0%, rgba(61,165,255,0.07), var(--color-surface) 68%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 20px rgba(0,0,0,0.22)',
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(61,165,255,0.45), transparent)' }}
          />
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Önizleme · 100 g
          </div>
          <div className="mt-1.5 flex items-baseline justify-center gap-1.5">
            <span className="text-[38px] font-bold leading-none tabular-nums tracking-tight text-text">
              {Number(customForm.calories_per_100g) || 0}
            </span>
            <span className="text-sm text-text-muted">kcal</span>
          </div>
          <div className={`mt-1.5 truncate text-sm font-medium ${customForm.name_tr ? 'text-text' : 'text-text-muted opacity-60'}`}>
            {customForm.name_tr || 'Yemeğin adı'}
            {customBrand.trim() && <span className="text-text-muted"> · {customBrand.trim()}</span>}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {macroInputs.map((m) => {
              const v = Number(customForm[m.key]) || 0
              return (
                <span
                  key={m.key}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] tabular-nums transition-opacity"
                  style={{
                    borderColor: v > 0 ? `${m.color}40` : 'rgba(255,255,255,0.07)',
                    backgroundColor: v > 0 ? `${m.color}14` : 'transparent',
                    color: v > 0 ? m.color : 'var(--color-text-muted)',
                    opacity: v > 0 ? 1 : 0.55,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {v}g {m.label}
                </span>
              )
            })}
          </div>
          {customBarcode && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] tabular-nums"
              style={{ borderColor: 'rgba(242,201,76,0.3)', backgroundColor: 'rgba(242,201,76,0.08)', color: '#D9B25F' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M7 8v8M10.5 8v8M13.5 8v8M17 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {customBarcode}
            </span>
          )}
        </div>

        <form onSubmit={handleCreateCustom} className="space-y-4">
          {/* form — satırlı sade defter */}
          <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-surface">
            <label className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3.5">
              <span className="w-14 shrink-0 text-xs font-medium text-text-muted">İsim</span>
              <input
                type="text"
                autoFocus={!customForm.name_tr}
                placeholder="örn. Annemin böreği"
                value={customForm.name_tr}
                onChange={(e) => setCustomForm((f) => ({ ...f, name_tr: e.target.value }))}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-muted"
              />
            </label>

            {customBarcode && (
              <label className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3.5">
                <span className="w-14 shrink-0 text-xs font-medium text-text-muted">Marka</span>
                <input
                  type="text"
                  placeholder="opsiyonel — örn. Ülker"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-muted"
                />
              </label>
            )}

            <label className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-14 shrink-0 text-xs font-medium text-text-muted">Kalori</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="0"
                value={customForm.calories_per_100g}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCustomForm((f) => ({ ...f, calories_per_100g: e.target.value }))}
                className="min-w-0 flex-1 bg-transparent text-right text-lg font-semibold tabular-nums text-text outline-none placeholder:text-text-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="shrink-0 text-xs text-text-muted">kcal / 100g</span>
            </label>

            {/* makrolardan canlı kalori önerisi — dokununca uygular */}
            <AnimatePresence>
              {kcalMismatch && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setCustomForm((f) => ({ ...f, calories_per_100g: String(macroKcal) }))}
                  className="btn-chip block w-full overflow-hidden border-t border-white/[0.05] px-4 py-2.5 text-left text-xs text-text-muted"
                >
                  Makrolara göre ≈ <span className="font-semibold tabular-nums text-text">{macroKcal} kcal</span>
                  <span className="float-right font-semibold" style={{ color: '#3DA5FF' }}>Uygula</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-3 border-t border-white/[0.05]">
              {macroInputs.map((m, i) => (
                <label key={m.key} className={`relative px-3 py-3.5 text-center ${i > 0 ? 'border-l border-white/[0.05]' : ''}`}>
                  <span
                    className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-b-full"
                    style={{ backgroundColor: `${m.color}66` }}
                  />
                  <span className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
                    {m.label}
                  </span>
                  <div className="mt-1 flex items-baseline justify-center gap-0.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      placeholder="0"
                      value={customForm[m.key]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCustomForm((f) => ({ ...f, [m.key]: e.target.value }))}
                      className="w-12 bg-transparent text-center text-lg font-semibold tabular-nums text-text outline-none placeholder:text-text-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-text-muted">g</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {customError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-sm text-red-400"
              >
                {customError}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={customSaving || !customForm.name_tr || !customForm.calories_per_100g}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)' }}
          >
            {customSaving ? 'Kaydediliyor...' : 'Kaydet ve Porsiyon Seç'}
          </motion.button>
        </form>
      </motion.div>
    )
  }

  if (view === 'detail' && selectedFood) {
    const presets = [50, 100, 150, 200, 250]
    const macroFields = [
      { key: 'protein_g', label: 'Protein', color: '#FF8A5B' },
      { key: 'fat_g', label: 'Yağ', color: '#F2C94C' },
      { key: 'carbs_g', label: 'Karb', color: '#6FCF97' },
    ]
    const amountNum = Number(amount) || 0
    const step = (delta) => setAmount((prev) => String(Math.max(0, Math.min(2000, (Number(prev) || 0) + delta))))

    return (
      <motion.div
        key={editingId ? `edit-${editingId}` : 'add'}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md space-y-4 px-4 py-6 pb-28"
      >
        {celebrationEl}
        <BackButton onClick={() => (editingId ? backToOverview() : setView('search'))} />

        {/* başlık */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text">{selectedFood.name_tr}</h1>
          {selectedFood.brand && (
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted opacity-80">
              {selectedFood.brand}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-text-muted">{selectedFood.calories_per_100g} kcal / 100g</span>
            {selectedFood.is_verified && (
              <span className="inline-flex items-center gap-1 text-text-muted">
                <span>✓</span> doğrulanmış
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
            <MealPeriodIcon type={activeMeal} color="var(--icon-muted)" size={14} />
            {editingId ? `${activeMealMeta?.label} öğünü düzenleniyor` : `${activeMealMeta?.label} öğününe ekleniyor`}
          </span>
        </div>

        {/* besin karnesi — puan + bilgilendirme */}
        <FoodReportCard food={selectedFood} />

        {/* sonuç — canlı besin değerleri */}
        {preview && <NutritionPreview preview={preview} macroFields={macroFields} amount={amountNum} />}

        {/* porsiyon kontrolü */}
        <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Porsiyon</div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => step(-10)}
              className="btn-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-2xl text-text-muted"
            >
              −
            </button>

            <div className="flex items-baseline gap-1">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value)}
                className="min-w-0 bg-transparent text-center text-4xl font-bold tabular-nums text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ width: `${Math.max(2, String(amount).length + 0.5)}ch` }}
              />
              <span className="text-lg text-text-muted">g</span>
            </div>

            <button
              type="button"
              onClick={() => step(10)}
              className="btn-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-black"
            >
              +
            </button>
          </div>

          {/* kaydırma çubuğu */}
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={Math.min(500, amountNum)}
            onChange={(e) => setAmount(e.target.value)}
            className="gram-slider mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-track accent-white"
            style={
              pixelUi
                ? {
                    // piksel dolum: ısırık izleri + accent ilerleme
                    background: `repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0 2px, transparent 2px 8px), linear-gradient(90deg, var(--color-accent) ${Math.min(100, (amountNum / 500) * 100)}%, var(--color-track) ${Math.min(100, (amountNum / 500) * 100)}%)`,
                  }
                : undefined
            }
          />
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-text-muted">
            <span>0</span>
            <span>250</span>
            <span>500g</span>
          </div>

          {/* hazır porsiyonlar */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className={`btn-chip rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  Number(amount) === p ? 'border-white/25 bg-white/10 text-text' : 'border-border text-text-muted'
                }`}
              >
                {p}g
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* sabit ekle butonu */}
        <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md px-4">
          <motion.button
            type="button"
            disabled={submitting || amountNum <= 0}
            onClick={handleAdd}
            whileTap={{ scale: 0.97 }}
            animate={saved ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            style={{
              boxShadow: saved
                ? '0 0 0 3px rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.4)'
                : '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)',
            }}
          >
            {saved ? (
              'Kaydedildi ✓'
            ) : submitting ? (
              editingId ? 'Güncelleniyor...' : 'Ekleniyor...'
            ) : (
              <>
                <span>{editingId ? 'Kaydet' : 'Ekle'}</span>
                <span className="tabular-nums opacity-80">· {Math.round(preview?.calories ?? 0)} kcal</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // ---- Tarif oluşturucu ----
  if (view === 'recipeBuilder' && recipeDraft) {
    // Malzeme ekleme modu: arama panelini göster.
    if (addingIngredient) {
      const searching = query.trim().length >= 2
      const showSkeleton = loading && results.length === 0
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-md space-y-4 px-4 py-6"
        >
          <div className="flex items-center justify-between">
            <BackButton onClick={() => { setAddingIngredient(false); setQuery('') }} label="Tarif" />
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
              Malzeme ekle
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 transition-colors focus-within:border-white/25">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-muted">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              autoFocus
              placeholder="Malzeme ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-3.5 text-[15px] text-text outline-none placeholder:text-text-muted"
            />
            {loading && results.length > 0 && (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-[1.8px] border-white/15 border-t-white/60" />
            )}
          </div>

          <div className="space-y-2">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {searching ? `"${query.trim()}" sonuçları` : 'Son kullanılanlar'}
            </span>
            {showSkeleton && (
              <>
                <Skeleton className="h-[60px] w-full rounded-2xl" />
                <Skeleton className="h-[60px] w-full rounded-2xl" />
              </>
            )}
            {!showSkeleton && results.length === 0 && !loading && (
              <div className="rounded-3xl border border-white/[0.06] bg-surface px-5 py-8 text-center text-sm text-text-muted">
                {searching ? `"${query.trim()}" bulunamadı` : 'Aramaya başla'}
              </div>
            )}
            {!showSkeleton &&
              results.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addIngredient(food)}
                  className="btn-row flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface py-3 pl-3.5 pr-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
                    <span className="text-sm font-bold leading-none tabular-nums text-text">{food.calories_per_100g}</span>
                    <span className="text-[8px] leading-tight text-text-muted">kcal</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-text">{highlightMatch(food.name_tr, query)}</span>
                    <span className="text-xs tabular-nums text-text-muted">
                      {Math.round(food.protein_per_100g ?? 0)}g pro · {Math.round(food.fat_per_100g ?? 0)}g yağ ·{' '}
                      {Math.round(food.carbs_per_100g ?? 0)}g karb / 100g
                      {searching && (
                        <span className="ml-2 font-bold" style={{ color: scoreFood(food).color }}>
                          {scoreFood(food).display}
                          <span className="font-medium text-text-muted opacity-60">/5</span>
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg text-text-muted">+</span>
                </button>
              ))}
          </div>
        </motion.div>
      )
    }

    const draftTotals = recipeTotals(recipeDraft)
    const per = Math.max(1, Number(recipeDraft.servings) || 1)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md space-y-4 px-4 py-6 pb-28"
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={() => { setRecipeDraft(null); setTab('recipes'); setView('search') }} label="Tarifler" />
          {recipes.some((r) => r.id === recipeDraft.id) && (
            <button
              type="button"
              onClick={() => deleteRecipe(recipeDraft.id)}
              className="btn-chip rounded-full border border-red-500/30 px-3 py-1 text-[13px] text-red-400"
            >
              Tarifi sil
            </button>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {recipes.some((r) => r.id === recipeDraft.id) ? 'Tarifi düzenle' : 'Yeni tarif'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Malzemeleri ekle, tarifin toplamı otomatik hesaplansın.</p>
        </div>

        <input
          type="text"
          autoFocus={!recipeDraft.name}
          placeholder="Tarif adı (örn. Yulaflı kahvaltı kâsesi)"
          value={recipeDraft.name}
          onChange={(e) => setRecipeDraft((d) => ({ ...d, name: e.target.value }))}
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[15px] text-text outline-none transition-colors placeholder:text-text-muted focus:border-white/25"
        />

        {/* porsiyon sayısı */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-surface px-4 py-3">
          <div>
            <div className="text-sm font-medium text-text">Kaç porsiyon çıkıyor?</div>
            <div className="text-xs text-text-muted">Porsiyon başı değerler buna göre hesaplanır.</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRecipeDraft((d) => ({ ...d, servings: Math.max(1, (Number(d.servings) || 1) - 1) }))}
              className="btn-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-lg text-text-muted"
            >
              −
            </button>
            <span className="w-6 text-center text-lg font-bold tabular-nums text-text">{per}</span>
            <button
              type="button"
              onClick={() => setRecipeDraft((d) => ({ ...d, servings: (Number(d.servings) || 1) + 1 }))}
              className="btn-icon flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-black"
            >
              +
            </button>
          </div>
        </div>

        {/* malzemeler */}
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Malzemeler</span>
          {recipeDraft.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-6 text-center text-sm text-text-muted">
              Henüz malzeme yok
            </div>
          ) : (
            recipeDraft.items.map((it, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface py-2.5 pl-3.5 pr-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-text">{it.food_name}</div>
                  <div className="text-xs tabular-nums text-text-muted">
                    {it.calories} kcal · {Math.round(it.protein_g)}g pro · {Math.round(it.fat_g)}g yağ ·{' '}
                    {Math.round(it.carbs_g)}g karb
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={it.amount_g}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setIngredientAmount(i, Number(e.target.value) || 0)}
                    className="w-10 bg-transparent text-right text-sm tabular-nums text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-text-muted">g</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  aria-label="Malzemeyi çıkar"
                  className="btn-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted"
                >
                  ✕
                </button>
              </div>
            ))
          )}

          <button
            type="button"
            onClick={openIngredientSearch}
            className="btn-chip flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/[0.14] py-3 text-sm text-text-muted transition-colors hover:border-white/30 hover:text-text"
          >
            + Malzeme ekle
          </button>
        </div>

        {/* toplam kartı */}
        {recipeDraft.items.length > 0 && (
          <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Toplam</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-text">{draftTotals.calories}</span>
                  <span className="text-sm text-text-muted">kcal</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums text-text">{Math.round(draftTotals.calories / per)} kcal</div>
                <div className="text-[11px] text-text-muted">porsiyon başı</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
              {[
                { label: 'Protein', v: draftTotals.protein_g, c: '#FF8A5B' },
                { label: 'Yağ', v: draftTotals.fat_g, c: '#F2C94C' },
                { label: 'Karb', v: draftTotals.carbs_g, c: '#6FCF97' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.c }} />
                    <span className="text-[11px] text-text-muted">{m.label}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-text">{Math.round(m.v)}g</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipeError && <p className="text-sm text-red-400">{recipeError}</p>}

        <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md px-4">
          <button
            type="button"
            disabled={recipeSaving}
            onClick={saveRecipeDraft}
            className="btn-primary w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)' }}
          >
            {recipeSaving ? 'Kaydediliyor...' : 'Tarifi Kaydet'}
          </button>
        </div>
      </motion.div>
    )
  }

  // ---- Tarif detay + öğüne ekleme ----
  if (view === 'recipeDetail' && recipeDetail) {
    const total = recipeTotals(recipeDetail)
    const per = Math.max(1, recipeDetail.servings || 1)
    const logged = recipeMacrosForServings(recipeDetail, Number(logServings) || 1)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md space-y-4 px-4 py-6 pb-28"
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={() => { setRecipeDetail(null); setTab('recipes'); setView('search') }} label="Tarifler" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
            <MealPeriodIcon type={activeMeal} color="var(--icon-muted)" size={14} />
            {activeMealMeta?.label}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-text">{recipeDetail.name}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {per} porsiyon · malzeme: {recipeDetail.items.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => editRecipe(recipeDetail)}
            className="btn-chip shrink-0 rounded-full border border-white/[0.1] px-3 py-1.5 text-[13px] text-text-muted"
          >
            Düzenle
          </button>
        </div>

        {/* porsiyon başı besin kartı */}
        <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Porsiyon başı</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-text">{Math.round(total.calories / per)}</span>
                <span className="text-sm text-text-muted">kcal</span>
              </div>
            </div>
            <div className="text-right text-xs text-text-muted">
              Toplam
              <div className="text-sm font-semibold tabular-nums text-text">{total.calories} kcal</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
            {[
              { label: 'Protein', v: total.protein_g / per, c: '#FF8A5B' },
              { label: 'Yağ', v: total.fat_g / per, c: '#F2C94C' },
              { label: 'Karb', v: total.carbs_g / per, c: '#6FCF97' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.c }} />
                  <span className="text-[11px] text-text-muted">{m.label}</span>
                </div>
                <div className="mt-1 text-sm font-semibold tabular-nums text-text">{Math.round(m.v)}g</div>
              </div>
            ))}
          </div>
        </div>

        {/* malzeme listesi (özet) */}
        <div className="space-y-1.5">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Malzemeler</span>
          {recipeDetail.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-[13px]">
              <span className="min-w-0 truncate text-text">
                {it.food_name} <span className="text-text-muted">· {it.amount_g}g</span>
              </span>
              <span className="shrink-0 tabular-nums text-text-muted">{it.calories} kcal</span>
            </div>
          ))}
        </div>

        {/* kaç porsiyon eklenecek */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-surface px-4 py-3">
          <span className="text-sm font-medium text-text">Kaç porsiyon eklensin?</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLogServings((s) => Math.max(1, s - 1))}
              className="btn-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-lg text-text-muted"
            >
              −
            </button>
            <span className="w-6 text-center text-lg font-bold tabular-nums text-text">{logServings}</span>
            <button
              type="button"
              onClick={() => setLogServings((s) => s + 1)}
              className="btn-icon flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-black"
            >
              +
            </button>
          </div>
        </div>

        {recipeError && <p className="text-sm text-red-400">{recipeError}</p>}

        <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md px-4">
          <button
            type="button"
            disabled={recipeSaving}
            onClick={logRecipe}
            className="btn-primary w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.12)' }}
          >
            {recipeSaving ? 'Ekleniyor...' : `${activeMealMeta?.label} öğününe ekle — ${logged.calories} kcal`}
          </button>
        </div>
      </motion.div>
    )
  }

  if (view === 'search') {
    const searching = query.trim().length >= 2
    const showSkeleton = loading && results.length === 0
    const listLabel = searching
      ? `"${query.trim()}" sonuçları`
      : tab === 'recent'
        ? 'Son kullanılanlar'
        : 'Favoriler'

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md space-y-4 px-4 py-6"
      >
        {celebrationEl}
        <div className="flex items-center justify-between">
          <BackButton onClick={backToOverview} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[13px] text-text-muted">
            <MealPeriodIcon type={activeMeal} color="var(--icon-muted)" size={14} />
            {activeMealMeta?.label}
          </span>
        </div>

        {/* arama çubuğu + barkod karosu */}
        {tab !== 'recipes' && (
          <div className="flex items-stretch gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 transition-colors focus-within:border-white/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-muted">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Yemek ara... (örn. menemen)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent py-3.5 text-[15px] text-text outline-none placeholder:text-text-muted"
              />
              {loading && results.length > 0 && (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-[1.8px] border-white/15 border-t-white/60" />
              )}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Aramayı temizle"
                  className="btn-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] text-text-muted"
                >
                  ✕
                </button>
              )}
            </div>

            {/* barkod tarayıcı — klas kare karo: köşe braketleri + orta tarama hattı */}
            <button
              type="button"
              onClick={() => setScanning(true)}
              aria-label="Barkod tara"
              className="btn-icon relative flex w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-text transition-colors"
              style={{
                borderColor: 'rgba(61,165,255,0.28)',
                background:
                  'linear-gradient(180deg, rgba(61,165,255,0.09), rgba(61,165,255,0.02) 60%), rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
                  stroke="#3DA5FF"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <path d="M7.5 8.5v7M11 8.5v7M14 8.5v7M16.5 8.5v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.85" />
              </svg>
            </button>
          </div>
        )}

        {/* sekmeler — kayan seçim pili */}
        {!searching && (
          <div className="grid grid-cols-3 rounded-2xl border border-white/[0.06] bg-surface p-1">
            {[
              { key: 'recent', label: 'Son' },
              { key: 'favorites', label: 'Favoriler' },
              { key: 'recipes', label: 'Tarifler' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative rounded-xl py-2 text-[13px] font-medium transition-colors ${
                  tab === t.key ? 'text-text' : 'text-text-muted'
                }`}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="search-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.07]"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {searchError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-sm text-red-400"
            >
              {searchError}
            </motion.p>
          )}
        </AnimatePresence>

        {tab === 'recipes' ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={startNewRecipe}
              className="btn-chip flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.14] py-3.5 text-sm font-medium text-text transition-colors hover:border-white/30"
            >
              <span className="text-lg leading-none">+</span> Yeni tarif oluştur
            </button>

            {recipes.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.06] bg-surface px-5 py-9 text-center">
                <p className="text-sm text-text">Henüz tarifin yok</p>
                <p className="mt-1 text-xs text-text-muted">
                  Uygulamadaki yemekleri birleştirip kendi tariflerini oluştur, tek dokunuşla ekle.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Tariflerin
                  </span>
                  <span className="text-[11px] tabular-nums text-text-muted">{recipes.length}</span>
                </div>
                {recipes.map((recipe, i) => {
                  const t = recipeTotals(recipe)
                  const per = Math.max(1, recipe.servings || 1)
                  const perCal = Math.round(t.calories / per)
                  return (
                    <motion.button
                      key={recipe.id}
                      type="button"
                      onClick={() => openRecipeDetail(recipe)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
                      className="btn-row flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface py-3 pl-3.5 pr-4 text-left"
                    >
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
                        <span className="text-sm font-bold leading-none tabular-nums text-text">{perCal}</span>
                        <span className="text-[8px] leading-tight text-text-muted">kcal</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-text">{recipe.name}</span>
                        <span className="mt-1 flex items-center gap-2.5 text-xs tabular-nums text-text-muted">
                          {MACRO_DOTS.map((d) => (
                            <span key={d.suffix} className="flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                              {Math.round((d.suffix === 'P' ? t.protein_g : d.suffix === 'Y' ? t.fat_g : t.carbs_g) / per)}
                              {d.suffix}
                            </span>
                          ))}
                          <span>· {per} porsiyon</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-text-muted">›</span>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{listLabel}</span>
            {!showSkeleton && results.length > 0 && (
              <span className="text-[11px] tabular-nums text-text-muted">{results.length}</span>
            )}
          </div>

          {showSkeleton && (
            <>
              <Skeleton className="h-[68px] w-full rounded-2xl" />
              <Skeleton className="h-[68px] w-full rounded-2xl" />
              <Skeleton className="h-[68px] w-full rounded-2xl" />
            </>
          )}

          {!showSkeleton && results.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/[0.06] bg-surface px-5 py-9 text-center"
            >
              {searching ? (
                <>
                  <p className="text-sm text-text">"{query.trim()}" bulunamadı</p>
                  <p className="mt-1 text-xs text-text-muted">Besin değerlerini girerek kendin ekleyebilirsin.</p>
                  <button
                    type="button"
                    onClick={openCustomFood}
                    className="btn-primary mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    "{query.trim()}" olarak ekle
                  </button>
                </>
              ) : tab === 'favorites' ? (
                <>
                  <p className="text-sm text-text">Henüz favorin yok</p>
                  <p className="mt-1 text-xs text-text-muted">Sık yediklerini yıldıza dokunarak buraya sabitle.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-text">Henüz kayıt yok</p>
                  <p className="mt-1 text-xs text-text-muted">Aramaya başla — eklediklerin burada görünecek.</p>
                </>
              )}
            </motion.div>
          )}

          {!showSkeleton &&
            (() => {
              // MacroFactor tarzı: özgün yemekler üstte, markalı ürünler ayrı bölümde.
              const sections = searching
                ? [
                    { key: 'generic', label: 'Temel Besinler', items: results.filter((f) => !f.brand) },
                    { key: 'branded', label: 'Markalı Ürünler', items: results.filter((f) => f.brand) },
                  ].filter((s) => s.items.length > 0)
                : [{ key: 'all', label: null, items: results }]
              const showHeaders = searching && sections.some((s) => s.key === 'branded')
              let rowIndex = -1
              return sections.map((section) => (
                <div key={section.key} className="space-y-2">
                  {showHeaders && (
                    <div className="flex items-center gap-2.5 px-1 pt-1.5">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                        {section.label}
                      </span>
                      <span className="h-px flex-1 bg-white/[0.07]" />
                      <span className="text-[10px] tabular-nums text-text-muted opacity-70">{section.items.length}</span>
                    </div>
                  )}
                  {section.items.map((food) => {
              rowIndex += 1
              const i = rowIndex
              const isFav = favoriteIds.has(food.id)
              const karne = scoreFood(food)
              return (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: loading ? 0.55 : 1, y: 0 }}
                  transition={{ delay: loading ? 0 : Math.min(i * 0.04, 0.3), duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-surface py-3 pl-3.5 pr-2.5"
                >
                  <button
                    type="button"
                    onClick={() => selectFood(food)}
                    className="btn-row flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
                      {pixelUi && hasPixelFoodIcon(food.name_tr) ? (
                        <>
                          <PixelFoodIcon name={food.name_tr} size={19} />
                          <span className="mt-0.5 inline-flex items-center gap-[3px] text-[11px] font-bold leading-none tabular-nums text-text">
                            {food.calories_per_100g}
                            <PixelFlame size={11} />
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold leading-none tabular-nums text-text">
                            {food.calories_per_100g}
                          </span>
                          <span className="text-[8px] leading-tight text-text-muted">kcal</span>
                        </>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-text">
                        {highlightMatch(food.name_tr, query)}
                        {food.is_verified && <span className="ml-1 text-text-muted">✓</span>}
                      </span>
                      {food.brand && (
                        <span className="mt-0.5 block truncate text-[10.5px] font-medium uppercase tracking-wide text-text-muted opacity-80">
                          {food.brand}
                        </span>
                      )}
                      <span className="mt-1 flex items-center gap-2.5 text-xs tabular-nums text-text-muted">
                        {MACRO_DOTS.map((d) => (
                          <span key={d.suffix} className="flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                            {Math.round(food[d.key] ?? 0)}
                            {d.suffix}
                          </span>
                        ))}
                        <span>/ {food.default_serving_g || 100}g</span>
                      </span>
                      {karne && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setKarneFood(food)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                              setKarneFood(food)
                            }
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-[10.5px] leading-none"
                          aria-label="Besin Karnesi ayrıntısı"
                        >
                          <span className="font-bold tabular-nums" style={{ color: karne.color }}>
                            {karne.display}
                          </span>
                          <span className="font-medium text-text-muted opacity-60">/5</span>
                          <span className="ml-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-white/[0.14] font-serif text-[9.5px] italic text-text-muted">
                            i
                          </span>
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(food.id)}
                    aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    className={`btn-icon relative flex h-9 w-9 shrink-0 items-center justify-center after:absolute after:-inset-1.5 after:content-[''] ${isFav ? '' : 'text-text-muted'}`}
                  >
                    <StarIcon isActive={isFav} />
                  </button>

                  <QuickAddButton state={quickState[food.id]} onClick={() => quickAdd(food)} />
                </motion.div>
              )
                  })}
                </div>
              ))
            })()}
        </div>

        {!showSkeleton && results.length > 0 && (
          <button
            type="button"
            onClick={openCustomFood}
            className="btn-chip flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/[0.12] py-3 text-sm text-text-muted transition-colors hover:border-white/30 hover:text-text"
          >
            + Özel yemek ekle
          </button>
        )}
        </>
        )}
      </motion.div>
    )
  }

  const totalToday = logs.reduce((sum, l) => sum + l.calories, 0)
  const currentMeal = defaultMealType()
  const currentIdx = MEAL_TYPES.findIndex((m) => m.value === currentMeal)
  const sortedMeals =
    currentIdx > 0 ? [...MEAL_TYPES.slice(currentIdx), ...MEAL_TYPES.slice(0, currentIdx)] : MEAL_TYPES
  const progressPct = goalCalories ? Math.min(100, (totalToday / goalCalories) * 100) : 0
  const consumedProtein = logs.reduce((sum, l) => sum + (l.protein_g ?? 0), 0)
  const consumedCarbs = logs.reduce((sum, l) => sum + (l.carbs_g ?? 0), 0)
  const consumedFat = logs.reduce((sum, l) => sum + (l.fat_g ?? 0), 0)

  const remaining = goalCalories ? Math.max(0, goalCalories - Math.round(totalToday)) : null
  const macroSummary = [
    { label: 'Protein', color: '#FF8A5B', consumed: consumedProtein, goal: goalProtein },
    { label: 'Yağ', color: '#F2C94C', consumed: consumedFat, goal: goalFat },
    { label: 'Karb', color: '#6FCF97', consumed: consumedCarbs, goal: goalCarbs },
  ]

  const dayLabel = isToday
    ? 'Bugün'
    : selectedDate === addDays(today, -1)
      ? 'Dün'
      : formatHeaderDate(selectedDate)

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      {celebrationEl}

      {/* Gün gezinme çubuğu — ortada tarih, iki yanda oklar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          aria-label="Önceki gün"
          className="btn-icon flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-text-muted transition-colors hover:text-text"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={selectedDate}
            type="button"
            onClick={() => setSelectedDate(today)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col items-center"
          >
            <span className="text-lg font-semibold tracking-tight text-text">{dayLabel}</span>
            <span className="text-[11px] text-text-muted">
              {isToday ? formatHeaderDate(today) : 'Bugüne dön'}
            </span>
          </motion.button>
        </AnimatePresence>

        <button
          type="button"
          disabled={isToday}
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Sonraki gün"
          className="btn-icon flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-text-muted transition-colors hover:text-text disabled:opacity-30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9.5 5.5 16 12l-6.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {logsLoading ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : (
        <div className="rounded-3xl border border-white/[0.06] bg-surface p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[38px] font-bold leading-none tabular-nums tracking-tight text-text">
                  {Math.round(totalToday)}
                </span>
                <span className="text-sm tabular-nums text-text-muted">/ {goalCalories || '—'} kcal</span>
              </div>
            </div>
            {remaining != null && (
              <div className="text-right">
                <div className="text-lg font-semibold leading-none tabular-nums text-text">{remaining}</div>
                <div className="mt-1 text-[11px] text-text-muted">kalan</div>
              </div>
            )}
          </div>

          {goalCalories ? (
            <div className="bar-track mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                className="bar-fill h-full rounded-full"
                style={{ backgroundColor: profile?.preferences?.ringColor || '#3DA5FF' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.7, ease: barEase }}
              />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-4">
            {macroSummary.map((m, i) => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[11px] text-text-muted">{m.label}</span>
                </div>
                <div className="mt-1 text-sm font-semibold tabular-nums text-text">
                  {Math.round(m.consumed)}
                  <span className="font-normal text-text-muted"> / {Math.round(m.goal)}g</span>
                </div>
                <div className="bar-track mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    className="bar-fill h-full rounded-full"
                    style={{ backgroundColor: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.goal > 0 ? Math.min(100, (m.consumed / m.goal) * 100) : 0}%` }}
                    transition={{ duration: 0.7, delay: 0.08 * i, ease: barEase }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ücretsiz plan sayacı — limit dolmadan Gold'u tatlı dille hatırlatır */}
      {!gold && !logsLoading && (
        <Link
          to="/profil"
          className="btn-row flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5"
          style={{
            borderColor: 'rgba(245,200,75,0.28)',
            background: 'linear-gradient(90deg, rgba(245,200,75,0.08), rgba(245,200,75,0.02))',
          }}
        >
          <span className="flex items-center gap-1">
            {Array.from({ length: FREE_LOG_LIMIT }, (_, i) => (
              <span
                key={i}
                className="h-1.5 w-4 rounded-full"
                style={{
                  backgroundColor: i < logs.length ? '#F5C84B' : 'rgba(255,255,255,0.12)',
                  boxShadow: i < logs.length ? '0 0 6px rgba(245,200,75,0.5)' : 'none',
                }}
              />
            ))}
          </span>
          <span className="flex-1 text-[11px] text-text-muted">
            Ücretsiz kayıt · <span className="font-semibold tabular-nums text-text">{Math.min(logs.length, FREE_LOG_LIMIT)}/{FREE_LOG_LIMIT}</span>
          </span>
          <span className="shrink-0 text-[11px] font-semibold" style={{ color: '#F5C84B' }}>
            👑 Sınırsız için Gold
          </span>
        </Link>
      )}

      {logsLoading ? (
        <Skeleton className="h-72 w-full rounded-3xl" />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-surface">
          {sortedMeals.map((meal, idx) => {
            const mealLogs = logs.filter((l) => canonicalMealType(l.meal_type) === meal.value)
            const mealTotal = mealLogs.reduce((sum, l) => sum + l.calories, 0)
            const mealProtein = mealLogs.reduce((sum, l) => sum + (l.protein_g ?? 0), 0)
            const mealCarbs = mealLogs.reduce((sum, l) => sum + (l.carbs_g ?? 0), 0)
            const mealFat = mealLogs.reduce((sum, l) => sum + (l.fat_g ?? 0), 0)
            const isNow = isToday && meal.value === currentMeal
            const nowColor =
              (lightUi && NOW_COLORS_LIGHT[meal.value]) || NOW_COLORS[meal.value] || '#F2A93B'

            return (
              <div key={meal.value} className={idx > 0 ? 'border-t border-white/[0.06]' : ''}>
                <div className={`flex items-center gap-3.5 px-4 py-4 ${isNow ? 'bg-white/[0.025]' : ''}`}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: isNow ? `${nowColor}59` : 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <MealPeriodIcon
                      type={meal.value}
                      color={isNow ? nowColor : 'var(--icon-muted)'}
                      size={17}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-medium text-text">{meal.label}</span>
                      {isNow && (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: nowColor }}
                        >
                          Şimdi
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs tabular-nums text-text-muted">
                      {mealTotal > 0
                        ? `${Math.round(mealTotal)} kcal · ${Math.round(mealProtein)}g pro · ${Math.round(mealFat)}g yağ · ${Math.round(mealCarbs)}g karb`
                        : 'Henüz kayıt yok'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMeal(meal.value)}
                    aria-label={`${meal.label} öğününe ekle`}
                    className="btn-icon relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-lg text-text transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-white/10"
                  >
                    +
                  </button>
                </div>

                {mealLogs.length > 0 && (
                  <ul className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
                    {mealLogs.map((log) => (
                      <SwipeableLogRow key={log.id} id={log.id} onDelete={handleDelete} onTap={() => startEdit(log)}>
                        <div className="relative flex items-center justify-between px-4 pl-[4.4rem] text-sm">
                          {pixelUi && (
                            <PixelFoodIcon
                              name={log.food_name}
                              size={26}
                              className="absolute left-[26px] top-1/2 -translate-y-1/2"
                            />
                          )}
                          <span className="min-w-0 truncate text-[13px] text-text">
                            {log.food_name}
                            <span className="text-text-muted"> · {log.amount_g}g</span>
                          </span>
                          <span className="shrink-0 pl-3 text-right">
                            <div className="text-[13px] font-medium tabular-nums text-text">
                              {Math.round(log.calories)} kcal
                            </div>
                            <div className="text-[11px] tabular-nums text-text-muted">
                              {Math.round(log.protein_g ?? 0)}g pro · {Math.round(log.fat_g ?? 0)}g yağ ·{' '}
                              {Math.round(log.carbs_g ?? 0)}g karb
                            </div>
                          </span>
                        </div>
                      </SwipeableLogRow>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!logsLoading && <SupplementTracker />}
    </div>
  )
}
