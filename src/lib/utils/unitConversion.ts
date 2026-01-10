import type { Unit, BaseUnit } from '@/types';

/**
 * Convertit une quantite vers l'unite de base de sa famille
 * Ex: 2 kg -> 2000 g, 50 cl -> 500 ml
 */
export function convertToBaseUnit(
  quantity: number,
  unit: Unit
): { quantity: number; baseUnit: BaseUnit } {
  return {
    quantity: quantity * unit.conversion_ratio,
    baseUnit: unit.base_unit,
  };
}

/**
 * Convertit une quantite de l'unite de base vers une unite cible
 * Retourne null si les familles sont differentes
 */
export function convertFromBaseUnit(
  quantity: number,
  baseUnit: BaseUnit,
  targetUnit: Unit
): number | null {
  if (targetUnit.base_unit !== baseUnit) {
    return null;
  }
  return quantity / targetUnit.conversion_ratio;
}

/**
 * Convertit entre deux unites de la meme famille
 * Retourne null si les familles sont differentes
 */
export function convertBetweenUnits(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit
): number | null {
  if (fromUnit.family !== toUnit.family) {
    return null;
  }
  const inBaseUnit = quantity * fromUnit.conversion_ratio;
  return inBaseUnit / toUnit.conversion_ratio;
}

/**
 * Calcule la quantite normalisee a partir de la quantite et de l'unite
 * C'est la fonction principale utilisee lors de la saisie d'ingredients
 */
export function normalizeQuantity(quantity: number, unit: Unit): number {
  return quantity * unit.conversion_ratio;
}

/**
 * Trouve la meilleure unite d'affichage pour une quantite normalisee
 * Prefere les unites plus grandes si la quantite le permet
 */
export function findBestDisplayUnit(
  normalizedQuantity: number,
  baseUnit: BaseUnit,
  availableUnits: Unit[]
): { quantity: number; unit: Unit } | null {
  const unitsInFamily = availableUnits
    .filter((u) => u.base_unit === baseUnit && u.is_displayable)
    .sort((a, b) => b.conversion_ratio - a.conversion_ratio);

  for (const unit of unitsInFamily) {
    const converted = normalizedQuantity / unit.conversion_ratio;
    if (converted >= 1 && Number.isInteger(converted)) {
      return { quantity: converted, unit };
    }
  }

  // Fallback: chercher l'unite avec le meilleur resultat >= 1
  for (const unit of unitsInFamily) {
    const converted = normalizedQuantity / unit.conversion_ratio;
    if (converted >= 1) {
      return { quantity: Math.round(converted * 100) / 100, unit };
    }
  }

  // Dernier recours: unite de base
  const baseUnitObj = availableUnits.find((u) => u.code === baseUnit);
  if (baseUnitObj) {
    return {
      quantity: normalizedQuantity,
      unit: baseUnitObj,
    };
  }

  return null;
}
