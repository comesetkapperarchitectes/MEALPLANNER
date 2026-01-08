import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import type {
  Recipe,
  RecipeFilters,
  RecipeImport,
  RecipeCreateInput,
  RecipeUpdateInput,
  RecipeShare,
  RecipeVisibility,
  Category,
  Season,
  NormalizedUnit,
} from '@/types';

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
    visibility: (r.visibility as RecipeVisibility) || 'private',
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
    visibility: (recipe.visibility as RecipeVisibility) || 'private',
    ingredients,
  };
}

export async function createRecipe(recipe: RecipeCreateInput): Promise<number> {
  const userId = await getCurrentUserId();
  const { ingredients, ...recipeData } = recipe;

  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipeData, user_id: userId })
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
          user_id: userId,
        }))
      );

    if (ingError) throw ingError;
  }

  return data.id;
}

export async function updateRecipe(id: number, recipe: RecipeUpdateInput): Promise<void> {
  const userId = await getCurrentUserId();
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
            user_id: userId,
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

// ============ Recipe Sharing Functions ============

export async function getRecipeShares(recipeId: number): Promise<RecipeShare[]> {
  const { data, error } = await supabase
    .from('recipe_shares')
    .select(`
      id,
      recipe_id,
      shared_with_user_id,
      shared_by_user_id,
      shared_at,
      profiles!recipe_shares_shared_with_user_id_fkey (
        id,
        email,
        display_name
      )
    `)
    .eq('recipe_id', recipeId);

  if (error) throw error;

  return (data || []).map((share: Record<string, unknown>) => {
    const profile = share.profiles as Record<string, unknown> | null;
    return {
      id: share.id as number,
      recipe_id: share.recipe_id as number,
      shared_with_user_id: share.shared_with_user_id as string,
      shared_by_user_id: share.shared_by_user_id as string,
      shared_at: share.shared_at as string,
      shared_with_user: profile ? {
        id: profile.id as string,
        email: profile.email as string,
        display_name: profile.display_name as string | null,
      } : undefined,
    };
  });
}

export async function shareRecipe(recipeId: number, email: string): Promise<void> {
  const userId = await getCurrentUserId();

  // Find user by email in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    throw new Error('Utilisateur non trouvé');
  }

  // Cannot share with yourself
  if (profile.id === userId) {
    throw new Error('Vous ne pouvez pas partager avec vous-même');
  }

  // Insert share
  const { error } = await supabase
    .from('recipe_shares')
    .insert({
      recipe_id: recipeId,
      shared_with_user_id: profile.id,
      shared_by_user_id: userId,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Recette déjà partagée avec cet utilisateur');
    }
    throw error;
  }
}

export async function unshareRecipe(recipeId: number, sharedWithUserId: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_shares')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('shared_with_user_id', sharedWithUserId);

  if (error) throw error;
}

export async function updateRecipeVisibility(
  recipeId: number,
  visibility: RecipeVisibility
): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ visibility })
    .eq('id', recipeId);

  if (error) throw error;

  // If changing from 'shared' to something else, clear all shares
  if (visibility !== 'shared') {
    await supabase
      .from('recipe_shares')
      .delete()
      .eq('recipe_id', recipeId);
  }
}

export async function searchUsersByEmail(
  email: string
): Promise<{ id: string; email: string; display_name: string | null }[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .ilike('email', `%${email}%`)
    .neq('id', userId)
    .limit(10);

  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id as string,
    email: p.email as string,
    display_name: p.display_name as string | null,
  }));
}
