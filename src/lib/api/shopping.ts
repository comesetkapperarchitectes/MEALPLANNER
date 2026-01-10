import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import { getUnits } from './units';
import type { ShoppingList, ShoppingListItem, IngredientCategory, Unit, UnitFamily, BaseUnit } from '@/types';
import { getMealPlan } from './mealPlan';
import { getRecipe } from './recipes';
import { getStock } from './stock';
import { getIngredients } from './ingredients';

export async function generateShoppingList(weekStart: string): Promise<number> {
  const userId = await getCurrentUserId();

  // Get meal plan for the week
  const meals = await getMealPlan(weekStart);

  // Get current stock
  const stock = await getStock();
  // Map by ingredient_id and base_unit for proper aggregation
  const stockMap = new Map<string, number>();
  for (const s of stock) {
    const baseUnit = s.unit?.base_unit || 'piece';
    const key = `${s.ingredient_id}-${baseUnit}`;
    stockMap.set(key, (stockMap.get(key) || 0) + s.quantity_normalized);
  }

  // Charger les unites
  const units = await getUnits();
  const unitsMap = new Map(units.map((u) => [u.id, u]));

  // Calculate needed ingredients (aggregated by ingredient_id and base_unit)
  const neededIngredients = new Map<string, {
    ingredient_id: number;
    quantity_normalized: number;
    unit_id: number;
    unit: Unit | undefined;
  }>();

  for (const meal of meals) {
    if (meal.recipe_id) {
      // Fetch recipe with ingredients
      const recipe = await getRecipe(meal.recipe_id);
      if (recipe?.ingredients) {
        const ratio = meal.servings / recipe.base_servings;
        for (const ing of recipe.ingredients) {
          const unit = ing.unit || unitsMap.get(ing.unit_id);
          const baseUnit = unit?.base_unit || 'piece';
          const key = `${ing.ingredient_id}-${baseUnit}`;
          const existing = neededIngredients.get(key);
          if (existing) {
            existing.quantity_normalized += ing.quantity_normalized * ratio;
          } else {
            neededIngredients.set(key, {
              ingredient_id: ing.ingredient_id,
              quantity_normalized: ing.quantity_normalized * ratio,
              unit_id: ing.unit_id,
              unit,
            });
          }
        }
      }
    }
  }

  // Subtract stock and staples
  const ingredients = await getIngredients();
  const stapleIds = new Set(ingredients.filter((i) => i.is_staple).map((i) => i.id));

  const toBuy: {
    ingredient_id: number;
    quantity_needed: number;
    unit_id: number;
    quantity_normalized: number;
  }[] = [];

  neededIngredients.forEach((needed, key) => {
    if (stapleIds.has(needed.ingredient_id)) return;

    const inStock = stockMap.get(key) || 0;
    const toBuyQty = Math.max(0, needed.quantity_normalized - inStock);

    if (toBuyQty > 0) {
      toBuy.push({
        ingredient_id: needed.ingredient_id,
        quantity_needed: toBuyQty,
        unit_id: needed.unit_id,
        quantity_normalized: toBuyQty,
      });
    }
  });

  // Delete existing list for this week
  const { data: existingList } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('week_start', weekStart)
    .single();

  if (existingList) {
    await supabase.from('shopping_list_items').delete().eq('list_id', existingList.id);
    await supabase.from('shopping_lists').delete().eq('id', existingList.id);
  }

  // Create new list
  const { data: newList, error } = await supabase
    .from('shopping_lists')
    .insert({ week_start: weekStart, status: 'draft', user_id: userId })
    .select('id')
    .single();

  if (error) throw error;

  // Create items
  if (toBuy.length > 0) {
    await supabase.from('shopping_list_items').insert(
      toBuy.map((item) => ({
        list_id: newList.id,
        ingredient_id: item.ingredient_id,
        quantity_needed: item.quantity_needed,
        unit_id: item.unit_id,
        quantity_normalized: item.quantity_normalized,
        checked: false,
        user_id: userId,
      }))
    );
  }

  return newList.id;
}

export async function getShoppingList(weekStart: string): Promise<ShoppingList | null> {
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('week_start', weekStart)
    .single();

  if (error || !list) return null;

  const { data: items } = await supabase
    .from('shopping_list_items')
    .select(`
      *,
      ingredients (id, name, category),
      units (*)
    `)
    .eq('list_id', list.id);

  const mappedItems: ShoppingListItem[] = (items || []).map((item: Record<string, unknown>) => {
    const ing = item.ingredients as Record<string, unknown>;
    const unitData = item.units as Record<string, unknown> | null;
    const unit: Unit | undefined = unitData ? {
      id: unitData.id as number,
      code: unitData.code as string,
      family: unitData.family as UnitFamily,
      base_unit: unitData.base_unit as BaseUnit,
      conversion_ratio: Number(unitData.conversion_ratio),
      translations: unitData.translations as Record<string, { singular: string; plural: string; abbr: string }>,
      is_displayable: unitData.is_displayable as boolean,
      display_order: unitData.display_order as number,
      needs_article: unitData.needs_article as boolean,
    } : undefined;

    return {
      id: item.id as number,
      ingredient_id: item.ingredient_id as number,
      ingredient_name: ing?.name as string || '',
      quantity_needed: item.quantity_needed as number,
      unit_id: item.unit_id as number,
      unit,
      quantity_normalized: item.quantity_normalized as number,
      category: ing?.category as IngredientCategory | null,
      checked: item.checked as boolean,
    };
  });

  return {
    ...list,
    items: mappedItems,
  } as ShoppingList;
}

export async function toggleShoppingItem(itemId: number): Promise<void> {
  const { data: item } = await supabase
    .from('shopping_list_items')
    .select('checked')
    .eq('id', itemId)
    .single();

  if (item) {
    await supabase
      .from('shopping_list_items')
      .update({ checked: !item.checked })
      .eq('id', itemId);
  }
}

export async function completeShopping(listId: number): Promise<void> {
  const userId = await getCurrentUserId();

  // Update list status
  await supabase
    .from('shopping_lists')
    .update({ status: 'purchased', purchased_at: new Date().toISOString() })
    .eq('id', listId);

  // Add purchased items to stock
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('ingredient_id, quantity_needed, unit_id, quantity_normalized')
    .eq('list_id', listId)
    .eq('checked', true);

  for (const item of items || []) {
    const { data: existing } = await supabase
      .from('stock')
      .select('id, quantity_normalized')
      .eq('ingredient_id', item.ingredient_id)
      .single();

    if (existing) {
      await supabase
        .from('stock')
        .update({ quantity_normalized: existing.quantity_normalized + item.quantity_normalized })
        .eq('id', existing.id);
    } else {
      await supabase.from('stock').insert({
        ingredient_id: item.ingredient_id,
        quantity: item.quantity_needed,
        unit_id: item.unit_id,
        quantity_normalized: item.quantity_normalized,
        user_id: userId,
      });
    }
  }
}
