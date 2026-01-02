-- Migration: Déplacer la colonne unit de ingredients vers recipe_ingredients
-- Exécuter ce script dans Supabase SQL Editor

-- ============================================
-- ÉTAPE 1: Ajouter unit à recipe_ingredients
-- ============================================
ALTER TABLE recipe_ingredients
ADD COLUMN unit VARCHAR(10) DEFAULT 'g';

-- Migrer les données - copier l'unité de chaque ingrédient
UPDATE recipe_ingredients ri
SET unit = i.unit
FROM ingredients i
WHERE ri.ingredient_id = i.id;

-- Rendre la colonne NOT NULL après migration
ALTER TABLE recipe_ingredients
ALTER COLUMN unit SET NOT NULL;

-- ============================================
-- ÉTAPE 2: Ajouter unit à stock
-- ============================================
ALTER TABLE stock
ADD COLUMN unit VARCHAR(10) DEFAULT 'g';

-- Migrer les données
UPDATE stock s
SET unit = i.unit
FROM ingredients i
WHERE s.ingredient_id = i.id;

-- Rendre la colonne NOT NULL après migration
ALTER TABLE stock
ALTER COLUMN unit SET NOT NULL;

-- ============================================
-- ÉTAPE 3: Ajouter unit à shopping_list_items
-- ============================================
ALTER TABLE shopping_list_items
ADD COLUMN unit VARCHAR(10) DEFAULT 'g';

-- Migrer les données
UPDATE shopping_list_items sli
SET unit = i.unit
FROM ingredients i
WHERE sli.ingredient_id = i.id;

-- Rendre la colonne NOT NULL après migration
ALTER TABLE shopping_list_items
ALTER COLUMN unit SET NOT NULL;

-- ============================================
-- ÉTAPE 4: Supprimer unit de ingredients
-- ============================================
ALTER TABLE ingredients
DROP COLUMN unit;

-- ============================================
-- Vérification (optionnel)
-- ============================================
-- SELECT ri.*, i.name FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id LIMIT 10;
-- SELECT * FROM stock LIMIT 10;
-- SELECT * FROM shopping_list_items LIMIT 10;
