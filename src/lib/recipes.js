// Kullanıcı tarifleri — MacroFactor tarzı: uygulamadaki yemeklerden malzeme
// ekleyerek oluşturulur. Ayrı bir tablo yerine profiles.preferences.recipes
// içinde JSON olarak saklanır (streak/tema/ödül verisiyle aynı yer).
//
// Tarif şekli:
// {
//   id: string,
//   name: string,
//   servings: number,        // tarif kaç porsiyon çıkarıyor
//   items: [{ food_id, food_name, amount_g, calories, protein_g, carbs_g, fat_g }],
//   createdAt: string (ISO)
// }

export function newRecipeId() {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function emptyRecipeDraft() {
  return { id: newRecipeId(), name: '', servings: 1, items: [] }
}

// Tarifin toplam makroları (tüm malzemelerin toplamı).
export function recipeTotals(recipe) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, amount_g: 0 }
  for (const it of recipe?.items ?? []) {
    t.calories += it.calories ?? 0
    t.protein_g += it.protein_g ?? 0
    t.carbs_g += it.carbs_g ?? 0
    t.fat_g += it.fat_g ?? 0
    t.amount_g += it.amount_g ?? 0
  }
  return {
    calories: Math.round(t.calories),
    protein_g: Math.round(t.protein_g * 10) / 10,
    carbs_g: Math.round(t.carbs_g * 10) / 10,
    fat_g: Math.round(t.fat_g * 10) / 10,
    amount_g: Math.round(t.amount_g),
  }
}

// Belirli porsiyon sayısı için makrolar (loglama sırasında kullanılır).
// servings = tarifin çıkardığı porsiyon; count = loglanacak porsiyon.
export function recipeMacrosForServings(recipe, count) {
  const total = recipeTotals(recipe)
  const per = Math.max(1, recipe?.servings ?? 1)
  const factor = count / per
  return {
    calories: Math.round(total.calories * factor),
    protein_g: Math.round(total.protein_g * factor * 10) / 10,
    carbs_g: Math.round(total.carbs_g * factor * 10) / 10,
    fat_g: Math.round(total.fat_g * factor * 10) / 10,
    amount_g: Math.round(total.amount_g * factor),
  }
}
