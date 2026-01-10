import { createServerSupabaseClient } from '../supabase-server';
import type { Translations } from '@/types';

export interface RecipeMetadata {
  id: number;
  name: string;
  translations: Translations | null;
  category: string;
  image_path: string | null;
  base_servings: number;
}

export async function getRecipeForMetadata(id: number): Promise<RecipeMetadata | null> {
  const supabase = await createServerSupabaseClient();

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('id, name, translations, category, image_path, base_servings')
    .eq('id', id)
    .single();

  if (error || !recipe) return null;

  return {
    id: recipe.id,
    name: recipe.name,
    translations: recipe.translations as Translations | null,
    category: recipe.category,
    image_path: recipe.image_path,
    base_servings: recipe.base_servings,
  };
}
