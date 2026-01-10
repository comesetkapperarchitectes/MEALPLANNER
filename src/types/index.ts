export type MealType = 'petit-dejeuner' | 'dejeuner' | 'gouter' | 'diner';
export type Category = 'petit-dejeuner' | 'entree' | 'plat' | 'dessert' | 'gouter';
export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';
export type IngredientCategory = 'legume' | 'fruit' | 'viande' | 'poisson' | 'epicerie' | 'frais' | 'surgele' | 'condiment';
export type NormalizedUnit = 'g' | 'ml' | 'piece';
export type ShoppingListStatus = 'draft' | 'validated' | 'purchased';
export type RecipeVisibility = 'private' | 'public' | 'shared';

// Translation types
export interface ContentTranslation {
  name?: string;
  instructions?: string;
}

export type Translations = Record<string, ContentTranslation>;

// Types pour le systeme d'unites
export type UnitFamily = 'mass' | 'volume' | 'piece';
export type BaseUnit = 'g' | 'ml' | 'piece';

export interface UnitTranslation {
  singular: string;
  plural: string;
  abbr: string;
}

export interface Unit {
  id: number;
  code: string;
  family: UnitFamily;
  base_unit: BaseUnit;
  conversion_ratio: number;
  translations: Record<string, UnitTranslation>;
  is_displayable: boolean;
  display_order: number;
  needs_article: boolean;
}

export interface Settings {
  id: number;
  family_size: number;
}

export interface Recipe {
  id: number;
  name: string;
  source_book?: string | null;
  source_page?: number | null;
  image_path?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  repos_time?: number | null;
  base_servings: number;
  category: Category;
  seasons: Season[];
  tags: string[];
  instructions?: string | null;
  ingredients?: RecipeIngredient[];
  user_id?: string | null;
  visibility: RecipeVisibility;
  translations?: Translations | null;
}

export interface RecipeShare {
  id: number;
  recipe_id: number;
  shared_with_user_id: string;
  shared_by_user_id: string;
  shared_at: string;
  shared_with_user?: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

export interface Ingredient {
  id: number;
  name: string;
  category?: IngredientCategory | null;
  is_staple: boolean;
  translations?: Translations | null;
}

export interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit_id: number;
  unit?: Unit;
  quantity_normalized: number;
  unit_normalized?: NormalizedUnit;
  ingredient_translations?: Translations | null;
}

export interface StockItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit_id: number;
  unit?: Unit;
  quantity_normalized: number;
  expiry_date?: string | null;
  category?: IngredientCategory | null;
  unit_normalized?: NormalizedUnit;
  ingredient_translations?: Translations | null;
}

export interface MealPlan {
  id: number;
  date: string;
  meal_type: MealType;
  recipe_id?: number | null;
  recipe?: Recipe | null;
  servings: number;
  is_prepared: boolean;
}

export interface ShoppingList {
  id: number;
  week_start: string;
  status: ShoppingListStatus;
  created_at: string;
  purchased_at?: string | null;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity_needed: number;
  unit_id: number;
  unit?: Unit;
  quantity_normalized: number;
  category?: IngredientCategory | null;
  checked: boolean;
  unit_normalized?: NormalizedUnit;
}

export interface RecipeImport {
  name: string;
  source_book?: string;
  source_page?: number;
  prep_time?: number;
  cook_time?: number;
  base_servings?: number;
  category: Category;
  seasons?: Season[];
  tags?: string[];
  instructions: string;
  ingredients: {
    name: string;
    quantity: number;
    unit_code: string;  // code de l'unite (g, kg, cas, etc.)
    category?: IngredientCategory;
  }[];
  image_base64?: string;
}

export interface RecipeFilters {
  search?: string;
  category?: Category;
  season?: Season;
  tags?: string[];
  ingredientId?: number;
}

export interface RecipeIngredientInput {
  ingredient_id: number;
  quantity: number;
  unit_id: number;
}

export type RecipeCreateInput = Omit<Recipe, 'id' | 'ingredients' | 'user_id'> & {
  ingredients?: RecipeIngredientInput[];
};

export type RecipeUpdateInput = Partial<Omit<Recipe, 'id' | 'ingredients' | 'user_id'>> & {
  ingredients?: RecipeIngredientInput[];
};
