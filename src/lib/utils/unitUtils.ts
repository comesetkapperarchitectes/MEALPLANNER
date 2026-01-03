import type { NormalizedUnit } from '@/types';

/**
 * Utilitaires pour la gestion des unités
 */

// Unités à masquer à l'affichage
const HIDDEN_UNITS = ['pièce', 'pièces', 'piece', 'pieces'];

/**
 * Formate l'unité d'affichage et détermine si l'unité normalisée doit être montrée
 */
export function formatUnitDisplay(
  unitDisplay: string | null | undefined,
  unitNormalized: NormalizedUnit | string | null | undefined
): { displayUnit: string; showNormalized: boolean } {
  const rawUnit = unitDisplay || '';
  const displayUnit = HIDDEN_UNITS.includes(rawUnit.toLowerCase()) ? '' : rawUnit;
  const showNormalized = unitNormalized !== 'piece' &&
    displayUnit !== unitNormalized &&
    displayUnit !== '';

  return { displayUnit, showNormalized };
}

/**
 * Formate une quantité avec son unité pour affichage
 */
export function formatQuantityWithUnit(
  quantity: number,
  unitDisplay: string | null | undefined,
  quantityNormalized?: number,
  unitNormalized?: NormalizedUnit | string | null
): { main: string; normalized: string | null } {
  const { displayUnit, showNormalized } = formatUnitDisplay(unitDisplay, unitNormalized);

  const main = displayUnit ? `${quantity} ${displayUnit}` : `${quantity}`;
  const normalized = showNormalized && quantityNormalized && unitNormalized
    ? `${quantityNormalized}${unitNormalized}`
    : null;

  return { main, normalized };
}

/**
 * Vérifie si une unité est une unité "pièce" (à ne pas afficher)
 */
export function isPieceUnit(unit: string | null | undefined): boolean {
  if (!unit) return true;
  return HIDDEN_UNITS.includes(unit.toLowerCase());
}
