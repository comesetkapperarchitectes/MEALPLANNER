import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for recipe import
interface ImportIngredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface ImportRecipe {
  name: string;
  source_book?: string;
  source_page?: number;
  prep_time?: number;
  cook_time?: number;
  base_servings?: number;
  category: 'petit-dejeuner' | 'entree' | 'plat' | 'dessert' | 'gouter';
  seasons?: string[];
  tags?: string[];
  instructions?: string;
  ingredients?: ImportIngredient[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support single recipe or array of recipes
    let recipes: ImportRecipe[] = [];
    if (Array.isArray(body)) {
      recipes = body;
    } else if (body.recipes && Array.isArray(body.recipes)) {
      recipes = body.recipes;
    } else if (body.name) {
      recipes = [body];
    } else {
      return NextResponse.json(
        { error: 'Format invalide. Attendu: une recette, un tableau de recettes, ou { recipes: [...] }' },
        { status: 400 }
      );
    }

    const importedIds: number[] = [];
    const errors: string[] = [];

    for (const recipe of recipes) {
      try {
        // Validate required fields
        if (!recipe.name || !recipe.category) {
          errors.push(`Recette invalide: nom et catégorie requis`);
          continue;
        }

        // Create or get ingredients
        const ingredientIds: { ingredient_id: number; quantity: number }[] = [];
        const recipeIngredients = recipe.ingredients || [];

        for (const ing of recipeIngredients) {
          // Check if ingredient exists
          let { data: existingIng } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', ing.name)
            .single();

          if (!existingIng) {
            const { data: newIng, error } = await supabase
              .from('ingredients')
              .insert({
                name: ing.name,
                unit: ing.unit || 'g',
                category: ing.category || null,
                is_staple: false,
              })
              .select('id')
              .single();

            if (error) {
              errors.push(`Erreur création ingrédient ${ing.name}: ${error.message}`);
              continue;
            }
            existingIng = newIng;
          }

          ingredientIds.push({
            ingredient_id: existingIng.id,
            quantity: ing.quantity || 0,
          });
        }

        // Create recipe
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            name: recipe.name,
            source_book: recipe.source_book || null,
            source_page: recipe.source_page || null,
            image_path: null,
            prep_time: recipe.prep_time || null,
            cook_time: recipe.cook_time || null,
            base_servings: recipe.base_servings || 4,
            category: recipe.category,
            seasons: recipe.seasons || [],
            tags: recipe.tags || [],
            instructions: recipe.instructions || null,
          })
          .select('id')
          .single();

        if (recipeError) {
          errors.push(`Erreur création recette ${recipe.name}: ${recipeError.message}`);
          continue;
        }

        // Create recipe ingredients
        if (ingredientIds.length > 0) {
          const { error: linkError } = await supabase.from('recipe_ingredients').insert(
            ingredientIds.map((ing) => ({
              recipe_id: newRecipe.id,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
            }))
          );

          if (linkError) {
            errors.push(`Erreur liaison ingrédients pour ${recipe.name}: ${linkError.message}`);
          }
        }

        importedIds.push(newRecipe.id);
      } catch (err) {
        errors.push(`Erreur inattendue pour ${recipe.name}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedIds.length,
      recipe_ids: importedIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status and get format info
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/import-recipe',
    method: 'POST',
    format: {
      single_recipe: {
        name: 'Nom de la recette (requis)',
        category: 'petit-dejeuner | entree | plat | dessert | gouter (requis)',
        source_book: 'Nom du livre (optionnel)',
        source_page: 'Numéro de page (optionnel)',
        prep_time: 'Temps de préparation en minutes (optionnel)',
        cook_time: 'Temps de cuisson en minutes (optionnel)',
        base_servings: 'Nombre de personnes de base, défaut: 4 (optionnel)',
        seasons: ['printemps', 'ete', 'automne', 'hiver'],
        tags: ['tag1', 'tag2'],
        instructions: 'Instructions de préparation (optionnel)',
        ingredients: [
          {
            name: 'Nom ingrédient (requis)',
            quantity: 'Quantité (requis)',
            unit: 'g | kg | ml | l | unite | cas | cac (requis)',
            category: 'legumes | fruits | viandes | poissons | produits-laitiers | epicerie | surgeles | boissons | autre (optionnel)',
          },
        ],
      },
      multiple_recipes: '[ ...recettes ] ou { recipes: [ ...recettes ] }',
    },
  });
}
