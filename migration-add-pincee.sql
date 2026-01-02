-- Migration: Ajouter l'unité "pincee" au système
-- Exécuter ce script dans Supabase SQL Editor

-- Note: Comme les colonnes unit sont de type VARCHAR(10) et non ENUM,
-- il n'y a pas besoin de modifier le schéma de la base de données.
-- La valeur "pincee" sera acceptée automatiquement.

-- Ce script est juste pour documentation.
-- Les modifications nécessaires sont:
-- 1. TypeScript: Unit type mis à jour ✓
-- 2. MCP Server: enum mis à jour ✓
-- 3. Base de données: VARCHAR accepte déjà "pincee" ✓

-- Vérification optionnelle - tester l'insertion:
-- INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
-- VALUES (1, 1, 1, 'pincee');
