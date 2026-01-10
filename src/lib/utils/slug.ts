import { getTranslatedName } from './translations';
import type { Translations } from '@/types';
import type { Locale } from '@/i18n/routing';

/**
 * Generate a URL-friendly slug from a string
 * Handles French accents and special characters
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize unicode characters (é -> e, à -> a, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-');
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(text);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Generate a recipe URL slug with ID prefix
 * Format: "123-recipe-name" or "123-translated-recipe-name"
 */
export function getRecipeSlug(
  id: number,
  name: string,
  translations?: Translations | null,
  locale?: Locale
): string {
  const displayName = locale
    ? getTranslatedName(translations, name, locale)
    : name;
  const slug = generateSlug(displayName);
  return `${id}-${slug}`;
}

/**
 * Extract recipe ID from a slug
 * Format: "123-recipe-name" -> 123
 */
export function getRecipeIdFromSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)-/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
