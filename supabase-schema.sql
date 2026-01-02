-- MealPlanner Supabase Schema
-- Execute this in the Supabase SQL Editor

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  family_size INTEGER NOT NULL DEFAULT 4
);

-- Insert default settings
INSERT INTO settings (family_size) VALUES (4) ON CONFLICT DO NOTHING;

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'piece', 'cas', 'cac', 'kg')),
  category TEXT CHECK (category IN ('legume', 'fruit', 'viande', 'poisson', 'epicerie', 'frais', 'surgele', 'condiment')),
  is_staple BOOLEAN NOT NULL DEFAULT false
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source_book TEXT,
  source_page INTEGER,
  image_path TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  base_servings INTEGER NOT NULL DEFAULT 4,
  category TEXT NOT NULL CHECK (category IN ('petit-dejeuner', 'entree', 'plat', 'dessert', 'gouter')),
  seasons TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients junction table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity REAL NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(recipe_id, ingredient_id)
);

-- Stock table
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE UNIQUE,
  quantity REAL NOT NULL DEFAULT 0,
  expiry_date DATE
);

-- Meal plan table
CREATE TABLE IF NOT EXISTS meal_plan (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'gouter', 'diner')),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  servings INTEGER NOT NULL DEFAULT 4,
  is_prepared BOOLEAN NOT NULL DEFAULT false,
  -- Permet plusieurs recettes par repas, mais pas de doublons de la même recette
  UNIQUE(date, meal_type, recipe_id)
);

-- Shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'purchased')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purchased_at TIMESTAMP WITH TIME ZONE
);

-- Shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed REAL NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_seasons ON recipes USING GIN(seasons);
CREATE INDEX IF NOT EXISTS idx_meal_plan_date ON meal_plan(date);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_week ON shopping_lists(week_start);

-- Enable Row Level Security (optional - can be customized later)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for public access without auth)
CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow all" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow all" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Allow all" ON stock FOR ALL USING (true);
CREATE POLICY "Allow all" ON meal_plan FOR ALL USING (true);
CREATE POLICY "Allow all" ON shopping_lists FOR ALL USING (true);
CREATE POLICY "Allow all" ON shopping_list_items FOR ALL USING (true);

-- Create a storage bucket for recipe images
-- Note: Run this in the Supabase dashboard under Storage > Create new bucket
-- Bucket name: recipe-images
-- Public: true
