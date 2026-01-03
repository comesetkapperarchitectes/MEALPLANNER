"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import * as api from "@/lib/api";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { getMonday, formatDate } from "@/lib/utils/dateUtils";
import type { IngredientCategory } from "@/types";

interface ShoppingItem {
  ingredient_id: number;
  ingredient_name: string;
  quantity_needed: number;
  unit_display: string;
  category: IngredientCategory | null;
  checked: boolean;
  recipes: string[];
}

// Store checked items in localStorage
function getCheckedItems(weekStart: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  const stored = localStorage.getItem(`shopping-checked-${weekStart}`);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function setCheckedItems(weekStart: string, items: Set<number>) {
  localStorage.setItem(`shopping-checked-${weekStart}`, JSON.stringify([...items]));
}

export default function CoursesPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadShoppingList = useCallback(async () => {
    setIsLoading(true);
    try {
      const weekStartStr = formatDate(weekStart);

      // Get meal plan for the week
      const meals = await api.getMealPlan(weekStartStr);

      // Get current stock
      const stock = await api.getStock();
      const stockMap = new Map(stock.map((s) => [s.ingredient_id, s.quantity]));

      // Get all ingredients for staples info
      const allIngredients = await api.getIngredients();
      const stapleIds = new Set(allIngredients.filter((i) => i.is_staple).map((i) => i.id));
      const ingredientMap = new Map(allIngredients.map((i) => [i.id, i]));

      // Calculate needed ingredients
      const neededIngredients = new Map<number, { quantity: number; name: string; unit_display: string; category: IngredientCategory | null; recipes: Set<string> }>();

      for (const meal of meals) {
        if (meal.recipe_id) {
          const recipe = await api.getRecipe(meal.recipe_id);
          if (recipe?.ingredients) {
            const ratio = meal.servings / recipe.base_servings;
            for (const ing of recipe.ingredients) {
              const needed = ing.quantity * ratio;
              const existing = neededIngredients.get(ing.ingredient_id);
              if (existing) {
                existing.quantity += needed;
                existing.recipes.add(recipe.name);
              } else {
                const ingredient = ingredientMap.get(ing.ingredient_id);
                neededIngredients.set(ing.ingredient_id, {
                  quantity: needed,
                  name: ing.ingredient_name,
                  unit_display: ing.unit_display,
                  category: ingredient?.category || null,
                  recipes: new Set([recipe.name]),
                });
              }
            }
          }
        }
      }

      // Calculate what to buy (needed - stock, excluding staples)
      const shoppingItems: ShoppingItem[] = [];

      neededIngredients.forEach((info, ingredientId) => {
        if (stapleIds.has(ingredientId)) return;

        const inStock = stockMap.get(ingredientId) || 0;
        const toBuy = Math.max(0, info.quantity - inStock);

        if (toBuy > 0) {
          shoppingItems.push({
            ingredient_id: ingredientId,
            ingredient_name: info.name,
            quantity_needed: Math.ceil(toBuy), // Always round up
            unit_display: info.unit_display,
            category: info.category,
            checked: false,
            recipes: [...info.recipes],
          });
        }
      });

      // Sort by category then name
      shoppingItems.sort((a, b) => {
        if (a.category && b.category) {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
        } else if (a.category) return -1;
        else if (b.category) return 1;
        return a.ingredient_name.localeCompare(b.ingredient_name);
      });

      // Load checked state from localStorage
      const checked = getCheckedItems(weekStartStr);
      setCheckedIds(checked);

      setItems(shoppingItems);
    } catch (error) {
      console.error("Error loading shopping list:", error);
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setWeekStart(newDate);
  };

  const toggleItem = (ingredientId: number) => {
    const weekStartStr = formatDate(weekStart);
    const newChecked = new Set(checkedIds);
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId);
    } else {
      newChecked.add(ingredientId);
    }
    setCheckedIds(newChecked);
    setCheckedItems(weekStartStr, newChecked);
  };

  const addToStock = async () => {
    if (!confirm("Ajouter les articles cochés au stock ?")) return;

    try {
      for (const item of items) {
        if (checkedIds.has(item.ingredient_id)) {
          // Get current stock for this ingredient
          const stock = await api.getStock();
          const currentStock = stock.find(s => s.ingredient_id === item.ingredient_id);
          const currentQty = currentStock?.quantity || 0;

          // Add purchased quantity to stock
          await api.upsertStock(item.ingredient_id, currentQty + item.quantity_needed);
        }
      }

      // Clear checked items
      const weekStartStr = formatDate(weekStart);
      setCheckedIds(new Set());
      setCheckedItems(weekStartStr, new Set());

      // Reload list
      await loadShoppingList();
    } catch (error) {
      console.error("Error adding to stock:", error);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const groupedItems = INGREDIENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category === cat.value),
  })).filter((group) => group.items.length > 0);

  const uncategorizedItems = items.filter((item) => !item.category);

  const checkedCount = items.filter((i) => checkedIds.has(i.ingredient_id)).length;
  const totalCount = items.length;

  const formatRecipes = (recipes: string[]) => {
    if (recipes.length === 0) return "";
    const truncate = (name: string) => name.length > 20 ? name.slice(0, 18) + "…" : name;
    return recipes.map(truncate).join(", ");
  };

  const renderItem = (item: ShoppingItem) => {
    const isChecked = checkedIds.has(item.ingredient_id);
    return (
      <div
        key={item.ingredient_id}
        className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-accent/50 cursor-pointer ${
          isChecked ? "opacity-60" : ""
        }`}
        onClick={() => toggleItem(item.ingredient_id)}
      >
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => toggleItem(item.ingredient_id)}
          className="h-4 w-4 md:h-5 md:w-5"
        />
        <div className="flex-1 flex items-center justify-between gap-1 md:gap-2 min-w-0">
          <span className={`text-xs md:text-base ${isChecked ? "line-through" : ""}`}>
            {item.quantity_needed} {['pièce', 'pièces', 'piece'].includes(item.unit_display?.toLowerCase() || '') ? '' : item.unit_display} {item.ingredient_name}
          </span>
          {item.recipes.length > 0 && (
            <span className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[40%] md:max-w-[50%]">
              ({formatRecipes(item.recipes)})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header - responsive */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="hidden md:block text-3xl font-bold">Courses</h1>
        <div className="flex items-center justify-between md:justify-start md:gap-2 -mx-4 px-4 md:mx-0 md:px-0 py-2 md:py-0 bg-muted/50 md:bg-transparent">
          <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm md:text-base text-center">
            <span className="hidden md:inline">Semaine du </span>
            {formatDisplayDate(formatDate(weekStart))}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {checkedCount > 0 && (
        <Button onClick={addToStock} size="sm" className="w-full md:w-auto text-xs md:text-sm">
          <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          Ajouter {checkedCount} article{checkedCount > 1 ? "s" : ""} au stock
        </Button>
      )}

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : items.length === 0 ? (
        <Card className="-mx-4 md:mx-0 rounded-none md:rounded-lg border-x-0 md:border-x">
          <CardContent className="py-8 md:py-12 text-center">
            <Check className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4" />
            <p className="text-base md:text-lg font-medium">Rien à acheter !</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              Soit vous avez tout en stock, soit aucun repas n&apos;est planifié cette semaine
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">
              {checkedCount} / {totalCount} articles cochés
            </span>
          </div>

          <div className="-mx-4 md:mx-0 space-y-2 md:space-y-0 md:grid md:gap-4 md:grid-cols-2">
            {groupedItems.map((group) => (
              <Card key={group.value} className="rounded-none md:rounded-lg border-x-0 md:border-x">
                <CardHeader className="py-2 px-3 md:px-6 md:pb-2">
                  <CardTitle className="text-sm md:text-lg">{group.label}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-2 md:pb-6 space-y-0.5 md:space-y-1">
                  {group.items.map(renderItem)}
                </CardContent>
              </Card>
            ))}
            {uncategorizedItems.length > 0 && (
              <Card className="rounded-none md:rounded-lg border-x-0 md:border-x">
                <CardHeader className="py-2 px-3 md:px-6 md:pb-2">
                  <CardTitle className="text-sm md:text-lg">Autres</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-2 md:pb-6 space-y-0.5 md:space-y-1">
                  {uncategorizedItems.map(renderItem)}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
