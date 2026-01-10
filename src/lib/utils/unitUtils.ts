import type { Unit } from '@/types';

/**
 * Utilitaires pour la gestion des unites
 */

const HIDDEN_UNIT_CODES = ['piece'];

/**
 * Formate l'unite pour affichage
 */
export function formatUnit(
  unit: Unit | null | undefined,
  quantity: number,
  locale: string = 'fr'
): string {
  if (!unit || HIDDEN_UNIT_CODES.includes(unit.code)) {
    return '';
  }

  const translation = unit.translations[locale];
  if (!translation) {
    return unit.code;
  }

  // Si l'abbr est differente du singulier (ex: g, kg, ml, cas), utiliser l'abbr (invariable)
  // Sinon utiliser singulier/pluriel selon la quantite
  if (translation.abbr && translation.abbr !== translation.singular) {
    return translation.abbr;
  }

  return quantity > 1 ? translation.plural : translation.singular;
}

/**
 * Formate une quantite avec son unite
 */
export function formatQuantityUnit(
  quantity: number,
  unit: Unit | null | undefined,
  locale: string = 'fr'
): string {
  const unitStr = formatUnit(unit, quantity, locale);
  return unitStr ? `${quantity} ${unitStr}` : `${quantity}`;
}

/**
 * Verifie si l'unite est de type "piece" (non affichable)
 */
export function isHiddenUnit(unit: Unit | null | undefined): boolean {
  return !unit || HIDDEN_UNIT_CODES.includes(unit.code) || !unit.is_displayable;
}

/**
 * Retourne l'article a utiliser entre l'unite et l'ingredient
 * Ex: "de" pour "botte de persil", "d'" pour "gousse d'ail"
 * En anglais, pas d'article: "bunch of parsley" -> "bunch parsley" n'est pas correct
 * mais "1 bunch parsley" est acceptable, ou on utilise "of"
 */
export function getArticle(
  unit: Unit | null | undefined,
  ingredientName: string,
  locale: string = 'fr'
): string {
  if (!unit || !unit.needs_article) {
    return '';
  }

  // En anglais, utiliser "of "
  if (locale === 'en') {
    return 'of ';
  }

  // En français, voyelles et h muet pour l'elision
  const startsWithVowel = /^[aeiouhàâäéèêëïîôùûüœæ]/i.test(ingredientName);
  return startsWithVowel ? "d'" : 'de ';
}
