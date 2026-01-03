/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Retourne le lundi de la semaine contenant la date donnée
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formate une date en chaîne ISO (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Formate une date pour affichage (ex: "Lundi 15")
 */
export function formatDisplayDate(date: Date, dayName: string): string {
  return `${dayName} ${date.getDate()}`;
}

/**
 * Formate une date complète (ex: "15 janvier 2024")
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Vérifie si une date est expirée
 */
export function isExpired(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Vérifie si une date expire bientôt (dans les 3 jours)
 */
export function isExpiringSoon(date: string | null | undefined): boolean {
  if (!date) return false;
  const expiryDate = new Date(date);
  const today = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
}

/**
 * Calcule le nombre de jours avant expiration
 */
export function daysUntilExpiry(date: string | null | undefined): number | null {
  if (!date) return null;
  const expiryDate = new Date(date);
  const today = new Date();
  return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
