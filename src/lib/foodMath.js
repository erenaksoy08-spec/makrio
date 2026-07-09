export function computeMacrosForAmount(food, amount_g) {
  const ratio = amount_g / 100
  return {
    calories: Math.round(food.calories_per_100g * ratio),
    protein_g: Math.round(food.protein_per_100g * ratio * 10) / 10,
    carbs_g: Math.round(food.carbs_per_100g * ratio * 10) / 10,
    fat_g: Math.round(food.fat_per_100g * ratio * 10) / 10,
  }
}
