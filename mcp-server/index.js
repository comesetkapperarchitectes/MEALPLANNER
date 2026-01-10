import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration - hardcoded for simplicity
const SUPABASE_URL = "https://lmfgojycsquicexylkxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZmdvanljc3F1aWNleHlsa3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNDIyNjUsImV4cCI6MjA4MjgxODI2NX0.D1cb3REVWWVPw4V7oqnH6p2RMVqmRDMDTPFGe1Cr8qo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const server = new Server(
  {
    name: "meal-planner-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "import_recipe",
        description: `Importe une recette dans l'application meal-planner. Utilisez cet outil après avoir scanné/analysé une recette pour l'ajouter à la base de données.

IMPORTANT pour les ingrédients:
- quantity: la quantité TOTALE dans l'unité choisie (après calcul si nécessaire)
- unit_code: le code de l'unité (voir liste ci-dessous)

⚠️ CONVERSION DES CONTENANTS: Quand la recette mentionne des contenants (boîtes, pots, sachets avec contenance), TOUJOURS convertir en quantité totale:
- "2 boîtes de 40cl de lait de coco" → quantity=80, unit_code="cl" (2×40=80)
- "3 pots de 125g de yaourt" → quantity=375, unit_code="g" (3×125=375)
- "1 sachet de 11g de levure" → quantity=11, unit_code="g"
- "2 briques de 20cl de crème" → quantity=40, unit_code="cl" (2×20=40)
- "1/2 boîte de 400g de tomates" → quantity=200, unit_code="g" (400÷2=200)

La conversion en unité de base (g, ml, piece) est AUTOMATIQUE via la table units.

Codes d'unités disponibles:
- Masse: g, kg, pincee
- Volume: ml, cl, l, cas (cuillère à soupe ≈15ml), cac (cuillère à café ≈5ml), verre (≈200ml), tasse (≈250ml)
- Pièces: piece (pour comptables sans unité spéciale), gousse, tranche, feuille, botte, bouquet, sachet, brin, branche, tige, filet, cube, noix, grain, tete, plaque, poignee, grappe, boule, baton, trait

Exemples simples:
- 20 cl de crème → quantity=20, unit_code="cl"
- 2 gousses d'ail → quantity=2, unit_code="gousse"
- 1 kg de farine → quantity=1, unit_code="kg"
- 1 pincée de sel → quantity=1, unit_code="pincee"
- 2 cas d'huile → quantity=2, unit_code="cas"
- 400g de poulet → quantity=400, unit_code="g"
- 3 blancs de poulet → quantity=3, unit_code="piece"`,
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Nom de la recette (requis)",
            },
            category: {
              type: "string",
              enum: ["petit-dejeuner", "entree", "plat", "dessert", "gouter"],
              description: "Catégorie de la recette (requis)",
            },
            source_book: {
              type: "string",
              description: "Nom du livre source (optionnel)",
            },
            source_page: {
              type: "number",
              description: "Numéro de page dans le livre (optionnel)",
            },
            prep_time: {
              type: "number",
              description: "Temps de préparation en minutes (optionnel)",
            },
            cook_time: {
              type: "number",
              description: "Temps de cuisson en minutes (optionnel)",
            },
            repos_time: {
              type: "number",
              description: "Temps de repos en minutes (optionnel, ex: levée de pâte, marinade)",
            },
            base_servings: {
              type: "number",
              description: "Nombre de personnes pour les quantités de base (défaut: 4)",
            },
            seasons: {
              type: "array",
              items: {
                type: "string",
                enum: ["printemps", "ete", "automne", "hiver"],
              },
              description: "Saisons appropriées pour cette recette (optionnel)",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags/étiquettes (ex: végétarien, rapide, économique)",
            },
            instructions: {
              type: "string",
              description: "Instructions de préparation EXACTEMENT comme dans la recette originale. NE PAS ajouter de titres, sous-titres, numérotation ou formatage (**, ##, etc.) qui n'existent pas dans le texte source. Copier le texte tel quel.",
            },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Nom de l'ingrédient",
                  },
                  quantity: {
                    type: "number",
                    description: "Quantité dans l'unité spécifiée",
                  },
                  unit_code: {
                    type: "string",
                    description: "Code de l'unité (g, kg, ml, cl, l, cas, cac, piece, gousse, etc.)",
                  },
                  category: {
                    type: "string",
                    enum: ["legume", "fruit", "viande", "poisson", "epicerie", "frais", "surgele", "condiment"],
                    description: "Catégorie de l'ingrédient (optionnel)",
                  },
                },
                required: ["name", "quantity", "unit_code"],
              },
              description: "Liste des ingrédients avec quantités",
            },
          },
          required: ["name", "category"],
        },
      },
      {
        name: "list_recipes",
        description: "Liste toutes les recettes dans la base de données meal-planner",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["petit-dejeuner", "entree", "plat", "dessert", "gouter"],
              description: "Filtrer par catégorie (optionnel)",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "import_recipe") {
    try {
      const recipe = args;
      const ingredientData = [];

      // Load all units for lookup
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*");

      if (unitsError) {
        return {
          content: [
            {
              type: "text",
              text: `Erreur chargement unités: ${unitsError.message}`,
            },
          ],
        };
      }

      const unitsByCode = new Map(units.map((u) => [u.code.toLowerCase(), u]));

      // Create or get ingredients
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        for (const ing of recipe.ingredients) {
          // Look up unit by code
          const unitCode = (ing.unit_code || "piece").toLowerCase();
          const unit = unitsByCode.get(unitCode);

          if (!unit) {
            return {
              content: [
                {
                  type: "text",
                  text: `Unité inconnue "${ing.unit_code}" pour l'ingrédient "${ing.name}". Codes valides: ${[...unitsByCode.keys()].join(", ")}`,
                },
              ],
            };
          }

          // Check if ingredient exists
          let { data: existingIng } = await supabase
            .from("ingredients")
            .select("id")
            .eq("name", ing.name)
            .single();

          if (!existingIng) {
            const { data: newIng, error } = await supabase
              .from("ingredients")
              .insert({
                name: ing.name,
                category: ing.category || null,
                is_staple: false,
              })
              .select("id")
              .single();

            if (error) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Erreur création ingrédient ${ing.name}: ${error.message}`,
                  },
                ],
              };
            }
            existingIng = newIng;
          }

          // Calculate normalized quantity automatically
          const quantity = ing.quantity || 0;
          const quantityNormalized = quantity * (unit.conversion_ratio || 1);

          ingredientData.push({
            ingredient_id: existingIng.id,
            quantity: quantity,
            unit_id: unit.id,
            quantity_normalized: quantityNormalized,
            unit_normalized: unit.base_unit,
          });
        }
      }

      // Create recipe
      const { data: newRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          name: recipe.name,
          source_book: recipe.source_book || null,
          source_page: recipe.source_page || null,
          image_path: null,
          prep_time: recipe.prep_time || null,
          cook_time: recipe.cook_time || null,
          repos_time: recipe.repos_time || null,
          base_servings: recipe.base_servings || 4,
          category: recipe.category,
          seasons: recipe.seasons || [],
          tags: recipe.tags || [],
          instructions: recipe.instructions || null,
        })
        .select("id, name")
        .single();

      if (recipeError) {
        return {
          content: [
            {
              type: "text",
              text: `Erreur création recette: ${recipeError.message}`,
            },
          ],
        };
      }

      // Link ingredients to recipe
      if (ingredientData.length > 0) {
        const { error: linkError } = await supabase
          .from("recipe_ingredients")
          .insert(
            ingredientData.map((ing) => ({
              recipe_id: newRecipe.id,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
              unit_id: ing.unit_id,
              quantity_normalized: ing.quantity_normalized,
              unit_normalized: ing.unit_normalized,
            }))
          );

        if (linkError) {
          return {
            content: [
              {
                type: "text",
                text: `Recette créée (ID: ${newRecipe.id}) mais erreur liaison ingrédients: ${linkError.message}`,
              },
            ],
          };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Recette "${newRecipe.name}" importée avec succès!\nID: ${newRecipe.id}\nIngrédients: ${ingredientData.length}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erreur inattendue: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === "list_recipes") {
    try {
      let query = supabase.from("recipes").select("id, name, category");

      if (args?.category) {
        query = query.eq("category", args.category);
      }

      const { data, error } = await query.order("name");

      if (error) {
        return {
          content: [
            {
              type: "text",
              text: `Erreur: ${error.message}`,
            },
          ],
        };
      }

      if (!data || data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Aucune recette trouvée.",
            },
          ],
        };
      }

      const list = data
        .map((r) => `- ${r.name} (${r.category}) [ID: ${r.id}]`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `${data.length} recette(s) trouvée(s):\n\n${list}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erreur: ${error.message}`,
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Outil inconnu: ${name}`,
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Meal Planner MCP Server running on stdio");
}

main().catch(console.error);
