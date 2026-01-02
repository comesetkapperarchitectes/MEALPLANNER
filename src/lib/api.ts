import { supabase } from './supabase';
import type {
  Settings,
  Recipe,
  Ingredient,
  StockItem,
  MealPlan,
  ShoppingList,
  ShoppingListItem,
  RecipeFilters,
  RecipeImport,
  RecipeCreateInput,
  RecipeUpdateInput,
  MealType,
  Category,
  Season,
  NormalizedUnit,
  IngredientCategory,
} from '@/types';

// Settings
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();

  if (error) {
    console.error('getSettings error:', error.message, error.code, error.details);
    // Create default settings if not exist
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert({ family_size: 4 })
      .select()
      .single();

    if (insertError) {
      console.error('Insert settings error:', insertError.message, insertError.code);
      throw insertError;
    }
    return newData as Settings;
  }

  return data as Settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update(settings)
    .eq('id', 1);

  if (error) throw error;
}

// Recipes
export async function getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  let query = supabase.from('recipes').select('*');

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.season) {
    query = query.contains('seasons', [filters.season]);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;

  return (data || []).map((r) => ({
    ...r,
    category: r.category as Category,
    seasons: r.seasons as Season[],
  }));
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  // Get ingredients
  const { data: recipeIngredients } = await supabase
    .from('recipe_ingredients')
    .select(`
      ingredient_id,
      quantity,
      unit_display,
      quantity_normalized,
      unit_normalized,
      position,
      ingredients (id, name)
    `)
    .eq('recipe_id', id)
    .order('position');

  const ingredients = (recipeIngredients || []).map((ri: Record<string, unknown>) => {
    const ing = ri.ingredients as Record<string, unknown>;
    return {
      ingredient_id: ri.ingredient_id as number,
      ingredient_name: ing?.name as string || '',
      quantity: ri.quantity as number,
      unit_display: ri.unit_display as string || 'g',
      quantity_normalized: ri.quantity_normalized as number,
      unit_normalized: (ri.unit_normalized as NormalizedUnit) || 'g',
    };
  });

  return {
    ...recipe,
    category: recipe.category as Category,
    seasons: recipe.seasons as Season[],
    ingredients,
  };
}

export async function createRecipe(recipe: RecipeCreateInput): Promise<number> {
  const { ingredients, ...recipeData } = recipe;

  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select('id')
    .single();

  if (error) throw error;

  if (ingredients && ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map((ing, index) => ({
          recipe_id: data.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit_display: ing.unit_display,
          quantity_normalized: ing.quantity_normalized,
          unit_normalized: ing.unit_normalized,
          position: index,
        }))
      );

    if (ingError) throw ingError;
  }

  return data.id;
}

export async function updateRecipe(id: number, recipe: RecipeUpdateInput): Promise<void> {
  const { ingredients, ...recipeData } = recipe;

  if (Object.keys(recipeData).length > 0) {
    const { error } = await supabase
      .from('recipes')
      .update(recipeData)
      .eq('id', id);

    if (error) throw error;
  }

  if (ingredients !== undefined) {
    // Delete existing ingredients
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);

    // Insert new ingredients
    if (ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(
          ingredients.map((ing, index) => ({
            recipe_id: id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit_display: ing.unit_display,
            quantity_normalized: ing.quantity_normalized,
            unit_normalized: ing.unit_normalized,
            position: index,
          }))
        );

      if (ingError) throw ingError;
    }
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
  await supabase.from('meal_plan').delete().eq('recipe_id', id);

  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadRecipeImage(recipeId: number, file: File): Promise<string> {
  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `recipe-${recipeId}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(fileName);

  const imagePath = urlData.publicUrl;

  // Update recipe with image path
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ image_path: imagePath })
    .eq('id', recipeId);

  if (updateError) throw updateError;

  return imagePath;
}

export async function importRecipes(recipes: RecipeImport[]): Promise<number[]> {
  const ids: number[] = [];

  for (const recipe of recipes) {
    // Create or get ingredients
    const ingredientIds: {
      ingredient_id: number;
      quantity: number;
      unit_display: string;
      quantity_normalized: number;
      unit_normalized: NormalizedUnit;
    }[] = [];
    const recipeIngredients = recipe.ingredients || [];

    for (const ing of recipeIngredients) {
      // Check if ingredient exists
      let { data: existingIng } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', ing.name)
        .single();

      if (!existingIng) {
        const { data: newIng, error } = await supabase
          .from('ingredients')
          .insert({
            name: ing.name,
            category: ing.category || null,
            is_staple: false,
          })
          .select('id')
          .single();

        if (error) throw error;
        existingIng = newIng;
      }

      ingredientIds.push({
        ingredient_id: existingIng.id,
        quantity: ing.quantity,
        unit_display: ing.unit_display,
        quantity_normalized: ing.quantity_normalized,
        unit_normalized: ing.unit_normalized,
      });
    }

    // Handle image if present
    let imagePath: string | null = null;
    if (recipe.image_base64) {
      const fileName = `recipe-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, Buffer.from(recipe.image_base64, 'base64'), {
          contentType: 'image/jpeg',
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName);
        imagePath = urlData.publicUrl;
      }
    }

    // Create recipe
    const { data: newRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name: recipe.name,
        source_book: recipe.source_book || null,
        source_page: recipe.source_page || null,
        image_path: imagePath,
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        base_servings: recipe.base_servings || 4,
        category: recipe.category,
        seasons: recipe.seasons || [],
        tags: recipe.tags || [],
        instructions: recipe.instructions,
      })
      .select('id')
      .single();

    if (recipeError) throw recipeError;

    // Create recipe ingredients
    if (ingredientIds.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        ingredientIds.map((ing) => ({
          recipe_id: newRecipe.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit_display: ing.unit_display,
          quantity_normalized: ing.quantity_normalized,
          unit_normalized: ing.unit_normalized,
        }))
      );
    }

    ids.push(newRecipe.id);
  }

  return ids;
}

// Ingredients
export async function getIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data || []).map((i) => ({
    ...i,
    category: i.category as IngredientCategory | null,
  }));
}

export async function createIngredient(
  ingredient: Omit<Ingredient, 'id'>
): Promise<number> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredient)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Stock
export async function getStock(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      ingredients (id, name, category)
    `)
    .order('expiry_date');

  if (error) throw error;

  return (data || []).map((s: Record<string, unknown>) => {
    const ing = s.ingredients as Record<string, unknown>;
    return {
      id: s.id as number,
      ingredient_id: s.ingredient_id as number,
      ingredient_name: ing?.name as string || '',
      quantity: s.quantity as number,
      unit_display: s.unit_display as string || 'g',
      quantity_normalized: s.quantity_normalized as number || s.quantity as number,
      unit_normalized: (s.unit_normalized as NormalizedUnit) || 'g',
      expiry_date: s.expiry_date as string | null,
      category: ing?.category as IngredientCategory | null,
    };
  });
}

export async function upsertStock(
  ingredientId: number,
  quantity: number,
  expiryDate?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('stock')
    .select('id')
    .eq('ingredient_id', ingredientId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('stock')
      .update({ quantity, expiry_date: expiryDate || null })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('stock').insert({
      ingredient_id: ingredientId,
      quantity,
      expiry_date: expiryDate || null,
    });
    if (error) throw error;
  }
}

export async function deleteStock(ingredientId: number): Promise<void> {
  const { error } = await supabase
    .from('stock')
    .delete()
    .eq('ingredient_id', ingredientId);
  if (error) throw error;
}

// Meal Plan
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

// Shopping Lists
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
