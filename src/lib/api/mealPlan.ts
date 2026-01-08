import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import type { MealPlan, MealType, Category, Season, Recipe } from '@/types';
import { getRecipe } from './recipes';

export async function getMealPlan(weekStart: string): Promise<MealPlan[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data, error } = await supabase
    .from('meal_plan')
    .select(`
      *,
      recipes (*)
    `)
    .gte('date', weekStart)
    .lte('date', weekEnd.toISOString().split('T')[0])
    .order('date')
    .order('meal_type');

  if (error) throw error;

  return (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as number,
    date: m.date as string,
    meal_type: m.meal_type as MealType,
    recipe_id: m.recipe_id as number | null,
    recipe: m.recipes ? {
      ...(m.recipes as Record<string, unknown>),
      category: (m.recipes as Record<string, unknown>).category as Category,
      seasons: (m.recipes as Record<string, unknown>).seasons as Season[],
    } as Recipe : null,
    servings: m.servings as number,
    is_prepared: m.is_prepared as boolean,
  }));
}

export async function addMealPlan(
  date: string,
  mealType: MealType,
  recipeId: number,
  servings: number
): Promise<number> {
  const userId = await getCurrentUserId();

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mealDate = new Date(date);
  const isPast = mealDate < today;

  const { data, error } = await supabase
    .from('meal_plan')
    .insert({
      date,
      meal_type: mealType,
      recipe_id: recipeId,
      servings,
      is_prepared: false,
      user_id: userId,
    })
    .select('id')
    .single();

  if (error) throw error;

  // If date is past, immediately mark as prepared (decrement stock)
  if (isPast) {
    await markMealPrepared(data.id);
  }

  return data.id;
}

export async function updateMealPlan(
  id: number,
  servings: number
): Promise<void> {
  const userId = await getCurrentUserId();

  // Get the current meal plan
  const { data: meal } = await supabase
    .from('meal_plan')
    .select('recipe_id, servings, is_prepared')
    .eq('id', id)
    .single();

  // If meal was prepared, adjust stock based on serving difference
  if (meal?.is_prepared && meal.recipe_id) {
    const recipe = await getRecipe(meal.recipe_id);
    if (recipe?.ingredients) {
      const oldRatio = meal.servings / recipe.base_servings;
      const newRatio = servings / recipe.base_servings;
      const ratioDiff = oldRatio - newRatio; // Positive = restore stock, Negative = consume more

      for (const ing of recipe.ingredients) {
        const quantityDiff = ing.quantity_normalized * ratioDiff;

        const { data: stockItem } = await supabase
          .from('stock')
          .select('id, quantity_normalized')
          .eq('ingredient_id', ing.ingredient_id)
          .single();

        if (stockItem) {
          const newQuantity = Math.max(0, stockItem.quantity_normalized + quantityDiff);
          await supabase
            .from('stock')
            .update({ quantity_normalized: newQuantity })
            .eq('id', stockItem.id);
        } else if (quantityDiff > 0) {
          // Create stock entry if restoring
          await supabase.from('stock').insert({
            ingredient_id: ing.ingredient_id,
            quantity: quantityDiff,
            unit_display: ing.unit_display,
            quantity_normalized: quantityDiff,
            unit_normalized: ing.unit_normalized,
            user_id: userId,
          });
        }
      }
    }
  }

  const { error } = await supabase
    .from('meal_plan')
    .update({ servings })
    .eq('id', id);

  if (error) throw error;
}

export async function removeMealPlan(id: number): Promise<void> {
  const userId = await getCurrentUserId();

  // Get the meal plan to check if it was prepared
  const { data: meal } = await supabase
    .from('meal_plan')
    .select('recipe_id, servings, is_prepared')
    .eq('id', id)
    .single();

  // If meal was prepared, restore the stock
  if (meal?.is_prepared && meal.recipe_id) {
    const recipe = await getRecipe(meal.recipe_id);
    if (recipe?.ingredients) {
      const ratio = meal.servings / recipe.base_servings;

      for (const ing of recipe.ingredients) {
        const quantityToRestore = ing.quantity_normalized * ratio;

        const { data: stockItem } = await supabase
          .from('stock')
          .select('id, quantity_normalized')
          .eq('ingredient_id', ing.ingredient_id)
          .single();

        if (stockItem) {
          await supabase
            .from('stock')
            .update({ quantity_normalized: stockItem.quantity_normalized + quantityToRestore })
            .eq('id', stockItem.id);
        } else {
          // Create stock entry if it doesn't exist
          await supabase.from('stock').insert({
            ingredient_id: ing.ingredient_id,
            quantity: quantityToRestore,
            unit_display: ing.unit_display,
            quantity_normalized: quantityToRestore,
            unit_normalized: ing.unit_normalized,
            user_id: userId,
          });
        }
      }
    }
  }

  const { error } = await supabase.from('meal_plan').delete().eq('id', id);
  if (error) throw error;
}

export async function markMealPrepared(id: number): Promise<void> {
  // Get the meal plan with recipe info
  const { data: meal, error: mealError } = await supabase
    .from('meal_plan')
    .select('recipe_id, servings, is_prepared')
    .eq('id', id)
    .single();

  if (mealError) throw mealError;
  if (!meal || meal.is_prepared) return; // Already prepared, don't decrement again

  // Get recipe with ingredients
  if (meal.recipe_id) {
    const recipe = await getRecipe(meal.recipe_id);
    if (recipe?.ingredients) {
      const ratio = meal.servings / recipe.base_servings;

      // Decrement stock for each ingredient
      for (const ing of recipe.ingredients) {
        const quantityUsed = ing.quantity_normalized * ratio;

        // Get current stock
        const { data: stockItem } = await supabase
          .from('stock')
          .select('id, quantity_normalized')
          .eq('ingredient_id', ing.ingredient_id)
          .single();

        if (stockItem) {
          const newQuantity = Math.max(0, stockItem.quantity_normalized - quantityUsed);
          await supabase
            .from('stock')
            .update({ quantity_normalized: newQuantity })
            .eq('id', stockItem.id);
        }
      }
    }
  }

  // Mark as prepared
  const { error } = await supabase
    .from('meal_plan')
    .update({ is_prepared: true })
    .eq('id', id);
  if (error) throw error;
}

// Auto-mark past meals as prepared (called on page load)
export async function autoMarkPastMeals(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Get all unprepared meals from the past
  const { data: pastMeals, error } = await supabase
    .from('meal_plan')
    .select('id')
    .lt('date', todayStr)
    .eq('is_prepared', false);

  if (error) throw error;

  let count = 0;
  for (const meal of pastMeals || []) {
    await markMealPrepared(meal.id);
    count++;
  }

  return count;
}
