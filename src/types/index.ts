export type MealType = 'petit-dejeuner' | 'dejeuner' | 'gouter' | 'diner';
export type Category = 'petit-dejeuner' | 'entree' | 'plat' | 'dessert' | 'gouter';
export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';
export type IngredientCategory = 'legume' | 'fruit' | 'viande' | 'poisson' | 'epicerie' | 'frais' | 'surgele' | 'condiment';
export type NormalizedUnit = 'g' | 'ml' | 'piece';
export type ShoppingListStatus = 'draft' | 'validated' | 'purchased';

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
  base_servings: number;
  category: Category;
  seasons: Season[];
  tags: string[];
  instructions?: string | null;
  ingredients?: RecipeIngredient[];
}

export interface Ingredient {
  id: number;
  name: string;
  category?: IngredientCategory | null;
  is_staple: boolean;
}

export interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit_display: string;
  quantity_normalized: number;
  unit_normalized: NormalizedUnit;
}

export interface StockItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit_display: string;
  quantity_normalized: number;
  unit_normalized: NormalizedUnit;
  expiry_date?: string | null;
  category?: IngredientCategory | null;
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
  unit_display: string;
  quantity_normalized: number;
  unit_normalized: NormalizedUnit;
  category?: IngredientCategory | null;
  checked: boolean;
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
    unit_display: string;
    quantity_normalized: number;
    unit_normalized: NormalizedUnit;
    category?: IngredientCategory;
  }[];
  image_base64?: string;
}

export interface RecipeFilters {
  search?: string;
  category?: Category;
  season?: Season;
  tags?: string[];
}

export interface RecipeIngredientInput {
  ingredient_id: number;
  quantity: number;
  unit_display: string;
  quantity_normalized: number;
  unit_normalized: NormalizedUnit;
}

export type RecipeCreateInput = Omit<Recipe, 'id' | 'ingredients'> & {
  ingredients?: RecipeIngredientInput[];
};

export type RecipeUpdateInput = Partial<Omit<Recipe, 'id' | 'ingredients'>> & {
  ingredients?: RecipeIngredientInput[];
};
