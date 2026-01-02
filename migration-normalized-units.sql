-- Migration: Ajouter les colonnes normalisées pour les unités
-- Exécuter ce script dans Supabase SQL Editor

-- ============================================
-- ÉTAPE 1: Modifier recipe_ingredients
-- ============================================
-- Renommer unit en unit_display (texte libre pour affichage)
ALTER TABLE recipe_ingredients
RENAME COLUMN unit TO unit_display;

-- Changer le type en TEXT pour permettre n'importe quelle unité
ALTER TABLE recipe_ingredients
ALTER COLUMN unit_display TYPE TEXT;

-- Ajouter les colonnes normalisées
ALTER TABLE recipe_ingredients
ADD COLUMN quantity_normalized DECIMAL(10,2),
ADD COLUMN unit_normalized VARCHAR(10) DEFAULT 'g';

-- Migrer les données existantes (conversion des unités connues)
UPDATE recipe_ingredients SET
  quantity_normalized = CASE unit_display
    WHEN 'g' THEN quantity
    WHEN 'kg' THEN quantity * 1000
    WHEN 'ml' THEN quantity
    WHEN 'cl' THEN quantity * 10
    WHEN 'l' THEN quantity * 1000
    WHEN 'piece' THEN quantity
    WHEN 'cas' THEN quantity * 15  -- 1 cuillère à soupe ≈ 15ml/g
    WHEN 'cac' THEN quantity * 5   -- 1 cuillère à café ≈ 5ml/g
    WHEN 'pincee' THEN quantity
    ELSE quantity
  END,
  unit_normalized = CASE unit_display
    WHEN 'g' THEN 'g'
    WHEN 'kg' THEN 'g'
    WHEN 'ml' THEN 'ml'
    WHEN 'cl' THEN 'ml'
    WHEN 'l' THEN 'ml'
    WHEN 'piece' THEN 'piece'
    WHEN 'cas' THEN 'ml'
    WHEN 'cac' THEN 'ml'
    WHEN 'pincee' THEN 'piece'
    ELSE 'piece'
  END;

-- Rendre les colonnes NOT NULL après migration
ALTER TABLE recipe_ingredients
ALTER COLUMN quantity_normalized SET NOT NULL,
ALTER COLUMN unit_normalized SET NOT NULL;

-- ============================================
-- ÉTAPE 2: Modifier stock
-- ============================================
ALTER TABLE stock
RENAME COLUMN unit TO unit_display;

ALTER TABLE stock
ALTER COLUMN unit_display TYPE TEXT;

ALTER TABLE stock
ADD COLUMN quantity_normalized DECIMAL(10,2),
ADD COLUMN unit_normalized VARCHAR(10) DEFAULT 'g';

UPDATE stock SET
  quantity_normalized = CASE unit_display
    WHEN 'g' THEN quantity
    WHEN 'kg' THEN quantity * 1000
    WHEN 'ml' THEN quantity
    WHEN 'cl' THEN quantity * 10
    WHEN 'l' THEN quantity * 1000
    WHEN 'piece' THEN quantity
    ELSE quantity
  END,
  unit_normalized = CASE unit_display
    WHEN 'g' THEN 'g'
    WHEN 'kg' THEN 'g'
    WHEN 'ml' THEN 'ml'
    WHEN 'cl' THEN 'ml'
    WHEN 'l' THEN 'ml'
    WHEN 'piece' THEN 'piece'
    ELSE 'piece'
  END;

ALTER TABLE stock
ALTER COLUMN quantity_normalized SET NOT NULL,
ALTER COLUMN unit_normalized SET NOT NULL;

-- ============================================
-- ÉTAPE 3: Modifier shopping_list_items
-- ============================================
ALTER TABLE shopping_list_items
RENAME COLUMN unit TO unit_display;

ALTER TABLE shopping_list_items
ALTER COLUMN unit_display TYPE TEXT;

ALTER TABLE shopping_list_items
ADD COLUMN quantity_normalized DECIMAL(10,2),
ADD COLUMN unit_normalized VARCHAR(10) DEFAULT 'g';

UPDATE shopping_list_items SET
  quantity_normalized = CASE unit_display
    WHEN 'g' THEN quantity_needed
    WHEN 'kg' THEN quantity_needed * 1000
    WHEN 'ml' THEN quantity_needed
    WHEN 'cl' THEN quantity_needed * 10
    WHEN 'l' THEN quantity_needed * 1000
    WHEN 'piece' THEN quantity_needed
    ELSE quantity_needed
  END,
  unit_normalized = CASE unit_display
    WHEN 'g' THEN 'g'
    WHEN 'kg' THEN 'g'
    WHEN 'ml' THEN 'ml'
    WHEN 'cl' THEN 'ml'
    WHEN 'l' THEN 'ml'
    WHEN 'piece' THEN 'piece'
    ELSE 'piece'
  END;

ALTER TABLE shopping_list_items
ALTER COLUMN quantity_normalized SET NOT NULL,
ALTER COLUMN unit_normalized SET NOT NULL;

-- ============================================
-- Vérification
-- ============================================
-- SELECT * FROM recipe_ingredients LIMIT 5;
-- SELECT * FROM stock LIMIT 5;
-- SELECT * FROM shopping_list_items LIMIT 5;
