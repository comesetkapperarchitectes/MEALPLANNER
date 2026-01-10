import { supabase } from '../supabase';
import { getCurrentUserId } from './utils';
import { getUnits } from './units';
import { normalizeQuantity } from '../utils/unitConversion';
import type { StockItem, IngredientCategory, Unit, UnitFamily, BaseUnit, Translations } from '@/types';

export async function getStock(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      ingredients (id, name, category, translations),
      units (*)
    `)
    .order('expiry_date');

  if (error) throw error;

  return (data || []).map((s: Record<string, unknown>) => {
    const ing = s.ingredients as Record<string, unknown>;
    const unitData = s.units as Record<string, unknown> | null;
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
      id: s.id as number,
      ingredient_id: s.ingredient_id as number,
      ingredient_name: ing?.name as string || '',
      quantity: s.quantity as number,
      unit_id: s.unit_id as number,
      unit,
      quantity_normalized: s.quantity_normalized as number || s.quantity as number,
      expiry_date: s.expiry_date as string | null,
      category: ing?.category as IngredientCategory | null,
      ingredient_translations: ing?.translations as Translations | null,
    };
  });
}

export async function upsertStock(
  ingredientId: number,
  quantity: number,
  unitId: number,
  expiryDate?: string
): Promise<void> {
  const userId = await getCurrentUserId();

  // Charger l'unite pour calculer quantity_normalized
  const units = await getUnits();
  const unit = units.find((u) => u.id === unitId);
  const quantityNormalized = unit ? normalizeQuantity(quantity, unit) : quantity;

  const { data: existing } = await supabase
    .from('stock')
    .select('id')
    .eq('ingredient_id', ingredientId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('stock')
      .update({
        quantity,
        unit_id: unitId,
        quantity_normalized: quantityNormalized,
        expiry_date: expiryDate || null,
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('stock').insert({
      ingredient_id: ingredientId,
      quantity,
      unit_id: unitId,
      quantity_normalized: quantityNormalized,
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
