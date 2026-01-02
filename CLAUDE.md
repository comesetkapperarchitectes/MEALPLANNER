# Meal Planner - Guide pour Claude

## Description du projet
Application de planification de repas hebdomadaire avec gestion des stocks et liste de courses automatique.

## Stack technique
- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **MCP Server**: Pour import de recettes via Claude Desktop

## Structure du projet
```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── planning/          # Planning hebdomadaire des repas
│   ├── recettes/          # Gestion des recettes
│   ├── courses/           # Liste de courses
│   ├── stock/             # Gestion du stock
│   └── parametres/        # Paramètres (taille famille)
├── components/ui/         # Composants shadcn/ui
├── lib/
│   ├── api.ts            # Fonctions API Supabase
│   ├── supabase.ts       # Client Supabase
│   └── utils.ts          # Utilitaires
└── types/
    └── index.ts          # Types TypeScript

mcp-server/
└── index.js              # Serveur MCP pour Claude Desktop
```

## Base de données (Supabase)

### Tables principales
- `recipes`: Recettes (name, category, seasons, instructions, base_servings, etc.)
- `ingredients`: Ingrédients (name, category, is_staple)
- `recipe_ingredients`: Liaison recette-ingrédient avec quantités
- `meal_plan`: Planning des repas (date, meal_type, recipe_id, servings, is_prepared)
- `stock`: Stock d'ingrédients
- `shopping_lists` / `shopping_list_items`: Listes de courses

### Système d'unités (dual-unit)
Chaque ingrédient dans une recette a deux représentations:
- **unit_display**: Texte libre pour affichage (cl, gousse, boîte de 40cl, cas, cac, pincée...)
- **quantity_normalized** + **unit_normalized**: Valeur convertie en unité de base (g, ml, piece)

Exemples:
- `2 boîtes de 40 cl` → unit_display="boîtes de 40 cl", quantity_normalized=800, unit_normalized="ml"
- `5 gousses d'ail` → unit_display="gousses", quantity_normalized=5, unit_normalized="piece"
- `2 cas d'huile` → unit_display="cas", quantity_normalized=30, unit_normalized="ml"

### Catégories
- **Recettes**: petit-dejeuner, entree, plat, dessert, gouter
- **Repas**: petit-dejeuner, dejeuner, gouter, diner
- **Ingrédients**: legume, fruit, viande, poisson, epicerie, frais, surgele, condiment
- **Saisons**: printemps, ete, automne, hiver

## Règles d'affichage des unités
- Ne PAS afficher "pièce", "pièces", "piece" (ex: "6 Blancs de poulet" pas "6 pièces Blancs de poulet")
- Afficher la quantité normalisée à droite en gris quand pertinent (ex: "2 boîtes de 40 cl Lait de coco    800ml")

## Gestion du stock
- Le stock se décrémente quand un repas est marqué "préparé"
- Les repas passés sont auto-marqués comme préparés au chargement de la page planning
- Supprimer/modifier un repas préparé restaure/ajuste le stock
- La liste de courses soustrait le stock existant et ignore les ingrédients "staple"

## MCP Server (Claude Desktop)
Outil `import_recipe` pour importer des recettes scannées directement dans Supabase.

**Important pour les instructions**: Copier le texte EXACTEMENT comme dans la recette originale. Ne PAS ajouter de titres, sous-titres ou formatage (**, ##) qui n'existent pas dans le texte source.

## Commandes utiles
```bash
# Développement
npm run dev

# MCP Server (dans mcp-server/)
node index.js
```

## Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```
