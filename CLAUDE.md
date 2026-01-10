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

### Système d'unités
Les unités sont centralisées dans la table `units` avec:
- **code**: Code court (g, kg, ml, cl, l, cas, cac, piece, gousse, etc.)
- **family**: Famille (mass, volume, piece)
- **base_unit**: Unité de base (g, ml, piece)
- **conversion_ratio**: Ratio de conversion vers l'unité de base
- **translations**: JSONB pour i18n (fr: {singular, plural, abbr})

La conversion est automatique via `conversion_ratio`:
- `20 cl de crème` → quantity=20, unit_id référence "cl" → quantity_normalized = 20 * 10 = 200ml
- `2 gousses d'ail` → quantity=2, unit_id référence "gousse" → quantity_normalized = 2 pieces
- `1 kg de farine` → quantity=1, unit_id référence "kg" → quantity_normalized = 1000g
- `2 cas d'huile` → quantity=2, unit_id référence "cas" → quantity_normalized = 30ml

### Catégories
- **Recettes**: petit-dejeuner, entree, plat, dessert, gouter
- **Repas**: petit-dejeuner, dejeuner, gouter, diner
- **Ingrédients**: legume, fruit, viande, poisson, epicerie, frais, surgele, condiment
- **Saisons**: printemps, ete, automne, hiver

## Règles d'affichage des unités
- Ne PAS afficher "pièce", "pièces", "piece" (ex: "6 Blancs de poulet" pas "6 pièces Blancs de poulet")
- Utiliser les abréviations françaises depuis `unit.translations.fr.abbr`

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
