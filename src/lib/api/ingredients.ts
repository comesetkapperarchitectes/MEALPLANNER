import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import type { Ingredient, IngredientCategory } from '@/types';

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
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('ingredients')
    .insert({ ...ingredient, user_id: userId })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
