import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import type { StockItem, NormalizedUnit, IngredientCategory } from '@/types';

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
  const userId = await getCurrentUserId();

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
      user_id: userId,
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
