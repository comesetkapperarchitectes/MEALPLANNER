import type { Locale } from '@/i18n/routing';

interface Translations {
  [locale: string]: {
    name?: string;
    instructions?: string;
  };
}

/**
 * Get translated name from a translations object
 * Falls back to the original name if translation is not available
 */
export function getTranslatedName(
  translations: Translations | null | undefined,
  originalName: string,
  locale: Locale
): string {
  if (!translations) return originalName;

  const translation = translations[locale];
  if (translation?.name && translation.name.trim() !== '') {
    return translation.name;
  }

  // Fallback to French, then original name
  if (locale !== 'fr' && translations.fr?.name) {
    return translations.fr.name;
  }

  return originalName;
}

/**
 * Get translated instructions from a translations object
 * Falls back to the original instructions if translation is not available
 */
export function getTranslatedInstructions(
  translations: Translations | null | undefined,
  originalInstructions: string | null | undefined,
  locale: Locale
): string | null {
  if (!translations) return originalInstructions ?? null;

  const translation = translations[locale];
  if (translation?.instructions && translation.instructions.trim() !== '') {
    return translation.instructions;
  }

  // Fallback to French, then original instructions
  if (locale !== 'fr' && translations.fr?.instructions) {
    return translations.fr.instructions;
  }

  return originalInstructions ?? null;
}
