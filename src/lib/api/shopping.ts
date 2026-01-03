import { supabase } from '../supabase';
import type { ShoppingList, ShoppingListItem, NormalizedUnit, IngredientCategory } from '@/types';
import { getMealPlan } from './mealPlan';
import { getRecipe } from './recipes';
import { getStock } from './stock';
import { getIngredients } from './ingredients';

export async function generateShoppingList(weekStart: string): Promise<number> {
  // Get meal plan for the week
  const meals = await getMealPlan(weekStart);

  // Get current stock
  const stock = await getStock();
  // Map by ingredient_id and unit_normalized for proper aggregation
  const stockMap = new Map<string, number>();
  for (const s of stock) {
    const key = `${s.ingredient_id}-${s.unit_normalized}`;
    stockMap.set(key, (stockMap.get(key) || 0) + s.quantity_normalized);
  }

  // Calculate needed ingredients (aggregated by ingredient_id and unit_normalized)
  const neededIngredients = new Map<string, {
    ingredient_id: number;
    quantity_normalized: number;
    unit_normalized: NormalizedUnit;
    unit_display: string;
  }>();

  for (const meal of meals) {
    if (meal.recipe_id) {
      // Fetch recipe with ingredients
      const recipe = await getRecipe(meal.recipe_id);
      if (recipe?.ingredients) {
        const ratio = meal.servings / recipe.base_servings;
        for (const ing of recipe.ingredients) {
          const key = `${ing.ingredient_id}-${ing.unit_normalized}`;
          const existing = neededIngredients.get(key);
          if (existing) {
            existing.quantity_normalized += ing.quantity_normalized * ratio;
          } else {
            neededIngredients.set(key, {
              ingredient_id: ing.ingredient_id,
              quantity_normalized: ing.quantity_normalized * ratio,
              unit_normalized: ing.unit_normalized,
              unit_display: ing.unit_display,
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
    unit_display: string;
    quantity_normalized: number;
    unit_normalized: NormalizedUnit;
  }[] = [];

  neededIngredients.forEach((needed, key) => {
    if (stapleIds.has(needed.ingredient_id)) return;

    const inStock = stockMap.get(key) || 0;
    const toBuyQty = Math.max(0, needed.quantity_normalized - inStock);

    if (toBuyQty > 0) {
      toBuy.push({
        ingredient_id: needed.ingredient_id,
        quantity_needed: toBuyQty,
        unit_display: needed.unit_display,
        quantity_normalized: toBuyQty,
        unit_normalized: needed.unit_normalized,
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
    .insert({ week_start: weekStart, status: 'draft' })
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
        unit_display: item.unit_display,
        quantity_normalized: item.quantity_normalized,
        unit_normalized: item.unit_normalized,
        checked: false,
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
      ingredients (id, name, category)
    `)
    .eq('list_id', list.id);

  const mappedItems: ShoppingListItem[] = (items || []).map((item: Record<string, unknown>) => {
    const ing = item.ingredients as Record<string, unknown>;
    return {
      id: item.id as number,
      ingredient_id: item.ingredient_id as number,
      ingredient_name: ing?.name as string || '',
      quantity_needed: item.quantity_needed as number,
      unit_display: item.unit_display as string || 'g',
      quantity_normalized: item.quantity_normalized as number,
      unit_normalized: (item.unit_normalized as NormalizedUnit) || 'g',
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
  // Update list status
  await supabase
    .from('shopping_lists')
    .update({ status: 'purchased', purchased_at: new Date().toISOString() })
    .eq('id', listId);

  // Add purchased items to stock
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('ingredient_id, quantity_needed, unit_display, quantity_normalized, unit_normalized')
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
        unit_display: item.unit_display,
        quantity_normalized: item.quantity_normalized,
        unit_normalized: item.unit_normalized,
      });
    }
  }
}
