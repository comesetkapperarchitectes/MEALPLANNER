"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/common";
import * as api from "@/lib/api";
import { MEAL_TYPES, DAY_KEYS } from "@/lib/constants";
import { getMonday, formatDate } from "@/lib/utils/dateUtils";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Locale } from "@/i18n/routing";
import {
  WeekNavigator,
  DaySelector,
  MealSlotDialog,
  AddRecipeDialog,
  ServingsDialog,
  EditServingsDialog,
  RecipeSheetDialog,
} from "./components";
import type { MealPlan, Recipe, MealType, Settings, Category } from "@/types";

const CATEGORY_ORDER: Category[] = ["entree", "plat", "dessert", "petit-dejeuner", "gouter"];

export default function PlanningPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Default to current day of the week (0 = Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, Monday (1) to 0
  });

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

  const weekDates = DAY_KEYS.map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });
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

  // Render a single day's meals (used for mobile view)
  const renderDayMeals = (dayIndex: number) => (
    <div className="space-y-3">
      {MEAL_TYPES.map(({ type }) => {
        const meals = getMealsForSlot(weekDates[dayIndex], type);
        const allPrepared = meals.length > 0 && meals.every(m => m.is_prepared);
        return (
          <Card
            key={`${DAY_KEYS[dayIndex]}-${type}`}
            className={`relative transition-colors cursor-pointer hover:shadow-md ${
              allPrepared ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/50"
            }`}
            onClick={() => openDetailDialog(weekDates[dayIndex], type)}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                <span>{t(`mealTypes.${type}`)}</span>
                {allPrepared && <Check className="h-4 w-4 text-green-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {meals.length === 0 ? (
                <>
                  <div className="h-[20px]" />
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <span className="text-3xl font-bold">+</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {meals.map((meal) => {
                    const recipeName = getTranslatedName(meal.recipe?.translations, meal.recipe?.name || '', locale);
                    return (
                      <div
                        key={meal.id}
                        className={`flex rounded-lg border overflow-hidden ${
                          meal.is_prepared
                            ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-background"
                        }`}
                      >
                        <div className="flex-1 p-3 min-w-0">
                          <p className="font-medium">{recipeName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <CategoryBadge
                              category={meal.recipe?.category as Category}
                              className="text-xs"
                            />
                            <span className="text-sm text-muted-foreground">{meal.servings} {t('recipes.servings')}</span>
                            {meal.is_prepared && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {t('planning.prepared')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {meal.recipe?.image_path && (
                          <div className="w-20 h-20 flex-shrink-0">
                            <img
                              src={meal.recipe.image_path}
                              alt={recipeName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - desktop only */}
      <div className="hidden md:flex md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">{t('planning.title')}</h1>
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={navigateWeek}
          formatDisplayDate={formatDisplayDate}
          formatDate={formatDate}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <>
          {/* Mobile day selector */}
          <DaySelector
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
            onNavigateWeek={navigateWeek}
            weekDates={weekDates}
            formatDisplayDate={formatDisplayDate}
            dayKeys={DAY_KEYS}
          />

          {/* Mobile view - single day */}
          <div className="md:hidden">
            {renderDayMeals(selectedDayIndex)}
          </div>

          {/* Desktop view - 7 day grid */}
          <div className="hidden md:grid grid-cols-7 gap-2">
            {DAY_KEYS.map((dayKey, dayIndex) => (
              <div key={dayKey} className="space-y-2">
                <div className="text-center font-medium p-2 bg-muted rounded-lg">
                  <div>{t(`days.${dayKey}`)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDisplayDate(weekDates[dayIndex])}
                  </div>
                </div>
                {MEAL_TYPES.map(({ type }) => {
                  const meals = getMealsForSlot(weekDates[dayIndex], type);
                  const allPrepared = meals.length > 0 && meals.every(m => m.is_prepared);
                  return (
                    <Card
                      key={`${dayKey}-${type}`}
                      className={`transition-colors cursor-pointer hover:shadow-md ${
                        allPrepared ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/50"
                      }`}
                      style={{ minHeight: `${getMinHeight(type)}px` }}
                      onClick={() => openDetailDialog(weekDates[dayIndex], type)}
                    >
                      <CardHeader className="p-2 pb-1">
                        <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
                          <span>{t(`mealTypes.${type}`)}</span>
                          {allPrepared && <Check className="h-3 w-3 text-green-600" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        {meals.length === 0 ? (
                          <div className="flex items-center justify-center py-1 text-muted-foreground">
                            <span className="text-xl font-bold">+</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {meals.map((meal) => {
                              const recipeName = getTranslatedName(meal.recipe?.translations, meal.recipe?.name || '', locale);
                              return (
                                <div
                                  key={meal.id}
                                  className={`flex rounded border text-xs overflow-hidden ${
                                    meal.is_prepared
                                      ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                      : "bg-background"
                                  }`}
                                >
                                  <div className="flex-1 p-1.5 min-w-0">
                                    <p className="font-medium line-clamp-1">{recipeName}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <CategoryBadge
                                        category={meal.recipe?.category as Category}
                                        className="text-[10px] px-1 py-0"
                                      />
                                      <span className="text-muted-foreground">{meal.servings}p</span>
                                      {meal.is_prepared && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                          {t('planning.prepared')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {meal.recipe?.image_path && (
                                    <div className="w-12 h-12 flex-shrink-0">
                                      <img
                                        src={meal.recipe.image_path}
                                        alt={recipeName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </>
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
      />

      <ServingsDialog
        open={servingsDialogOpen}
        onOpenChange={setServingsDialogOpen}
        recipe={selectedRecipeForServings}
        servings={servings}
        onServingsChange={setServings}
        onConfirm={handleConfirmServings}
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
      />
    </div>
  );
}
