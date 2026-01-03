import type { Category, Season, MealType, IngredientCategory } from '@/types';

// Catégories de recettes
export const RECIPE_CATEGORIES: { value: Category; label: string }[] = [
  { value: "petit-dejeuner", label: "Petit-déjeuner" },
  { value: "entree", label: "Entrée" },
  { value: "plat", label: "Plat" },
  { value: "dessert", label: "Dessert" },
  { value: "gouter", label: "Goûter" },
];

// Saisons
export const SEASONS: { value: Season; label: string }[] = [
  { value: "printemps", label: "Printemps" },
  { value: "ete", label: "Été" },
  { value: "automne", label: "Automne" },
  { value: "hiver", label: "Hiver" },
];

// Types de repas
export const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: "petit-dejeuner", label: "Petit-déjeuner" },
  { type: "dejeuner", label: "Déjeuner" },
  { type: "gouter", label: "Goûter" },
  { type: "diner", label: "Dîner" },
];

// Catégories d'ingrédients
export const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: "legume", label: "Légumes" },
  { value: "fruit", label: "Fruits" },
  { value: "viande", label: "Viandes" },
  { value: "poisson", label: "Poissons" },
  { value: "epicerie", label: "Épicerie" },
  { value: "frais", label: "Frais" },
  { value: "surgele", label: "Surgelés" },
  { value: "condiment", label: "Condiments" },
];

// Jours de la semaine
export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// Labels pour lookup rapide
export const CATEGORY_LABELS: Record<Category, string> = {
  "petit-dejeuner": "Petit-déjeuner",
  "entree": "Entrée",
  "plat": "Plat",
  "dessert": "Dessert",
  "gouter": "Goûter",
};

export const SEASON_LABELS: Record<Season, string> = {
  "printemps": "Printemps",
  "ete": "Été",
  "automne": "Automne",
  "hiver": "Hiver",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  "petit-dejeuner": "Petit-déjeuner",
  "dejeuner": "Déjeuner",
  "gouter": "Goûter",
  "diner": "Dîner",
};

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  "legume": "Légumes",
  "fruit": "Fruits",
  "viande": "Viandes",
  "poisson": "Poissons",
  "epicerie": "Épicerie",
  "frais": "Frais",
  "surgele": "Surgelés",
  "condiment": "Condiments",
};
