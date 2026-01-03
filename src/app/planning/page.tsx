"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";
import { MEAL_TYPES, DAYS } from "@/lib/constants";
import { getMonday, formatDate } from "@/lib/utils/dateUtils";
import {
  WeekNavigator,
  MealSlotDialog,
  AddRecipeDialog,
  ServingsDialog,
  EditServingsDialog,
  RecipeSheetDialog,
} from "./components";
import type { MealPlan, Recipe, MealType, Settings, Category } from "@/types";

const CATEGORY_ORDER: Category[] = ["entree", "plat", "dessert", "petit-dejeuner", "gouter"];

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [servings, setServings] = useState("4");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>("all");
  const [servingsDialogOpen, setServingsDialogOpen] = useState(false);
  const [selectedRecipeForServings, setSelectedRecipeForServings] = useState<Recipe | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [editServings, setEditServings] = useState("4");
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [selectedMealForRecipe, setSelectedMealForRecipe] = useState<MealPlan | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.autoMarkPastMeals();
      const [mealsData, recipesData, settingsData] = await Promise.all([
        api.getMealPlan(formatDate(weekStart)),
        api.getRecipes(),
        api.getSettings(),
      ]);
      setMealPlans(mealsData);
      setRecipes(recipesData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setWeekStart(newDate);
  };

  const getMealsForSlot = (date: string, mealType: MealType) => {
    return mealPlans
      .filter((m) => m.date === date && m.meal_type === mealType)
      .sort((a, b) => {
        const aIdx = CATEGORY_ORDER.indexOf(a.recipe?.category as Category);
        const bIdx = CATEGORY_ORDER.indexOf(b.recipe?.category as Category);
        return aIdx - bIdx;
      });
  };

  const openDetailDialog = (date: string, mealType: MealType) => {
    setSelectedSlot({ date, mealType });
    setDetailDialogOpen(true);
  };

  const openAddDialog = () => {
    setServings(settings?.family_size.toString() || "4");
    setRecipeSearch("");
    setRecipeCategoryFilter("all");
    setSelectedRecipeForServings(null);
    setAddDialogOpen(true);
  };

  const openServingsDialog = (recipe: Recipe) => {
    setSelectedRecipeForServings(recipe);
    setServings(settings?.family_size.toString() || "4");
    setServingsDialogOpen(true);
  };

  const handleConfirmServings = async () => {
    if (!selectedSlot || !selectedRecipeForServings) return;
    try {
      await api.addMealPlan(
        selectedSlot.date,
        selectedSlot.mealType,
        selectedRecipeForServings.id,
        parseInt(servings) || 4
      );
      await loadData();
      setServingsDialogOpen(false);
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding meal:", error);
    }
  };

  const openEditDialog = (meal: MealPlan) => {
    setEditingMeal(meal);
    setEditServings(meal.servings.toString());
    setEditDialogOpen(true);
  };

  const openRecipeDialog = async (meal: MealPlan) => {
    if (!meal.recipe_id) return;
    setSelectedMealForRecipe(meal);
    setLoadingRecipe(true);
    setRecipeDialogOpen(true);
    try {
      const recipe = await api.getRecipe(meal.recipe_id);
      setRecipeDetails(recipe);
    } catch (error) {
      console.error("Error loading recipe:", error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleUpdateServings = async () => {
    if (!editingMeal) return;
    try {
      await api.updateMealPlan(editingMeal.id, parseInt(editServings) || 4);
      await loadData();
      setEditDialogOpen(false);
      setEditingMeal(null);
    } catch (error) {
      console.error("Error updating meal:", error);
    }
  };

  const handleRemove = async (mealId: number) => {
    try {
      await api.removeMealPlan(mealId);
      await loadData();
    } catch (error) {
      console.error("Error removing meal:", error);
    }
  };

  const handleMarkPrepared = async (mealId: number) => {
    try {
      await api.markMealPrepared(mealId);
      await loadData();
    } catch (error) {
      console.error("Error marking meal prepared:", error);
    }
  };

  const weekDates = DAYS.map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const getCategoryBadge = (category: Category) => {
    const labels: Record<Category, string> = {
      "petit-dejeuner": "P.déj",
      "entree": "Entrée",
      "plat": "Plat",
      "dessert": "Dessert",
      "gouter": "Goûter",
    };
    return labels[category] || category;
  };

  const getFilteredRecipes = (mealType: MealType) => {
    let filtered = recipes;
    if (mealType === "petit-dejeuner") {
      filtered = filtered.filter(r => r.category === "petit-dejeuner");
    } else if (mealType === "gouter") {
      filtered = filtered.filter(r => r.category === "gouter" || r.category === "dessert");
    } else {
      filtered = filtered.filter(r => ["entree", "plat", "dessert"].includes(r.category));
    }
    if (recipeCategoryFilter !== "all") {
      filtered = filtered.filter(r => r.category === recipeCategoryFilter);
    }
    if (recipeSearch.trim()) {
      const search = recipeSearch.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(search));
    }
    return filtered;
  };

  const currentSlotMeals = selectedSlot
    ? getMealsForSlot(selectedSlot.date, selectedSlot.mealType)
    : [];

  // Calculate max meals per meal type for uniform height
  const maxMealsPerType: Record<MealType, number> = MEAL_TYPES.reduce((acc, { type }) => {
    const maxForType = Math.max(1, ...weekDates.map(date => getMealsForSlot(date, type).length));
    acc[type] = maxForType;
    return acc;
  }, {} as Record<MealType, number>);

  const getMinHeight = (mealType: MealType) => {
    const maxMeals = maxMealsPerType[mealType];
    return maxMeals === 0 ? 100 : 30 + (maxMeals * 60);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planning de la semaine</h1>
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={navigateWeek}
          formatDisplayDate={formatDisplayDate}
          formatDate={formatDate}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="space-y-2">
              <div className="text-center font-medium p-2 bg-muted rounded-lg">
                <div>{day}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDisplayDate(weekDates[dayIndex])}
                </div>
              </div>
              {MEAL_TYPES.map(({ type, label }) => {
                const meals = getMealsForSlot(weekDates[dayIndex], type);
                const allPrepared = meals.length > 0 && meals.every(m => m.is_prepared);
                return (
                  <Card
                    key={`${day}-${type}`}
                    className={`transition-colors cursor-pointer hover:shadow-md ${
                      allPrepared ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""
                    }`}
                    style={{ minHeight: `${getMinHeight(type)}px` }}
                    onClick={() => openDetailDialog(weekDates[dayIndex], type)}
                  >
                    <CardHeader className="p-2 pb-1">
                      <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>{label}</span>
                        {allPrepared && <Check className="h-3 w-3 text-green-600" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 space-y-1">
                      {meals.length === 0 ? (
                        <div className="flex items-center justify-center h-10 text-muted-foreground">
                          <span className="text-xs">Cliquer pour ajouter</span>
                        </div>
                      ) : (
                        meals.map((meal) => (
                          <div
                            key={meal.id}
                            className={`flex rounded border text-xs overflow-hidden ${
                              meal.is_prepared
                                ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-background"
                            }`}
                          >
                            <div className="flex-1 p-1.5 min-w-0">
                              <p className="font-medium line-clamp-1">{meal.recipe?.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {getCategoryBadge(meal.recipe?.category as Category)}
                                </Badge>
                                <span className="text-muted-foreground">{meal.servings}p</span>
                                {meal.is_prepared && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                    Fait
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {meal.recipe?.image_path && (
                              <div className="w-12 h-12 flex-shrink-0">
                                <img
                                  src={meal.recipe.image_path}
                                  alt={meal.recipe.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MealSlotDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        selectedSlot={selectedSlot}
        meals={currentSlotMeals}
        onAddRecipe={openAddDialog}
        onEditMeal={openEditDialog}
        onRemoveMeal={handleRemove}
        onMarkPrepared={handleMarkPrepared}
        onOpenRecipe={openRecipeDialog}
        getCategoryBadge={getCategoryBadge}
        formatFullDate={formatFullDate}
      />

      <AddRecipeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        recipes={selectedSlot ? getFilteredRecipes(selectedSlot.mealType) : []}
        searchValue={recipeSearch}
        onSearchChange={setRecipeSearch}
        categoryFilter={recipeCategoryFilter}
        onCategoryFilterChange={setRecipeCategoryFilter}
        onSelectRecipe={openServingsDialog}
        getCategoryBadge={getCategoryBadge}
      />

      <ServingsDialog
        open={servingsDialogOpen}
        onOpenChange={setServingsDialogOpen}
        recipe={selectedRecipeForServings}
        servings={servings}
        onServingsChange={setServings}
        onConfirm={handleConfirmServings}
        getCategoryBadge={getCategoryBadge}
      />

      <EditServingsDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        meal={editingMeal}
        servings={editServings}
        onServingsChange={setEditServings}
        onConfirm={handleUpdateServings}
      />

      <RecipeSheetDialog
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        recipe={recipeDetails}
        meal={selectedMealForRecipe}
        loading={loadingRecipe}
        getCategoryBadge={getCategoryBadge}
      />
    </div>
  );
}
