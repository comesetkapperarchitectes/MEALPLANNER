import { supabase } from '../supabase';
import type { Unit, UnitFamily, BaseUnit } from '@/types';

// Cache local des unites (charge une fois au demarrage)
let unitsCache: Unit[] | null = null;

export async function getUnits(): Promise<Unit[]> {
  if (unitsCache) return unitsCache;

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('display_order');

  if (error) throw error;

  unitsCache = (data || []).map((u) => ({
    ...u,
    family: u.family as UnitFamily,
    base_unit: u.base_unit as BaseUnit,
    conversion_ratio: Number(u.conversion_ratio),
  }));

  return unitsCache;
}

export async function getUnitById(id: number): Promise<Unit | null> {
  const units = await getUnits();
  return units.find((u) => u.id === id) || null;
}

export async function getUnitByCode(code: string): Promise<Unit | null> {
  const units = await getUnits();
  return units.find((u) => u.code === code) || null;
}

export async function getUnitsByFamily(family: UnitFamily): Promise<Unit[]> {
  const units = await getUnits();
  return units.filter((u) => u.family === family);
}

export async function getDisplayableUnits(): Promise<Unit[]> {
  const units = await getUnits();
  return units.filter((u) => u.is_displayable);
}

export function invalidateUnitsCache(): void {
  unitsCache = null;
}

// Fonction synchrone pour obtenir les unites depuis le cache
// A utiliser apres un premier appel a getUnits()
export function getUnitsSync(): Unit[] {
  return unitsCache || [];
}

export function getUnitByIdSync(id: number): Unit | undefined {
  return unitsCache?.find((u) => u.id === id);
}

export function getUnitByCodeSync(code: string): Unit | undefined {
  return unitsCache?.find((u) => u.code === code);
}
