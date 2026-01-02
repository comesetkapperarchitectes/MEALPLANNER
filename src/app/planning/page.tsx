"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, Pencil, Trash2, ChefHat, ArrowLeft, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import type { MealPlan, Recipe, MealType, Settings, Category } from "@/types";

const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: "petit-dejeuner", label: "Petit-déjeuner" },
  { type: "dejeuner", label: "Déjeuner" },
  { type: "gouter", label: "Goûter" },
  { type: "diner", label: "Dîner" },
];

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const CATEGORY_ORDER: Category[] = ["entree", "plat", "dessert", "petit-dejeuner", "gouter"];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "petit-dejeuner", label: "Petit-déjeuner" },
  { value: "entree", label: "Entrée" },
  { value: "plat", label: "Plat" },
  { value: "dessert", label: "Dessert" },
  { value: "gouter", label: "Goûter" },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog for viewing/managing a meal slot
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);

  // Dialog for adding a recipe
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [servings, setServings] = useState("4");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>("all");
  const [servingsDialogOpen, setServingsDialogOpen] = useState(false);
  const [selectedRecipeForServings, setSelectedRecipeForServings] = useState<Recipe | null>(null);

  // Dialog for editing servings
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [editServings, setEditServings] = useState("4");

  // Dialog for recipe preparation sheet
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [selectedMealForRecipe, setSelectedMealForRecipe] = useState<MealPlan | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Auto-mark past meals as prepared (decrement stock)
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
    setSelectedRecipeId("");
    setServings(settings?.family_size.toString() || "4");
    setRecipeSearch("");
    setRecipeCategoryFilter("all");
    setSelectedRecipeForServings(null);
    setAddDialogOpen(true);
  };

  const openServingsDialog = (recipe: Recipe) => {
    setSelectedRecipeForServings(recipe);
    setSelectedRecipeId(recipe.id.toString());
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
      // Keep detailDialogOpen open to allow adding more recipes
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

  const handleAddRecipe = async () => {
    if (!selectedSlot || !selectedRecipeId) return;

    try {
      await api.addMealPlan(
        selectedSlot.date,
        selectedSlot.mealType,
        parseInt(selectedRecipeId),
        parseInt(servings) || 4
      );
      await loadData();
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding meal:", error);
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

    // Filter by meal type
    if (mealType === "petit-dejeuner") {
      filtered = filtered.filter(r => r.category === "petit-dejeuner");
    } else if (mealType === "gouter") {
      filtered = filtered.filter(r => r.category === "gouter" || r.category === "dessert");
    } else {
      filtered = filtered.filter(r => ["entree", "plat", "dessert"].includes(r.category));
    }

    // Filter by category (if not "all")
    if (recipeCategoryFilter !== "all") {
      filtered = filtered.filter(r => r.category === recipeCategoryFilter);
    }

    // Filter by search
    if (recipeSearch.trim()) {
      const search = recipeSearch.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(search));
    }

    return filtered;
  };

  const currentSlotMeals = selectedSlot
    ? getMealsForSlot(selectedSlot.date, selectedSlot.mealType)
    : [];

  const allPreparedInSlot = currentSlotMeals.length > 0 && currentSlotMeals.every(m => m.is_prepared);

  // Calculate max meals per meal type across all days for uniform height
  const maxMealsPerType: Record<MealType, number> = MEAL_TYPES.reduce((acc, { type }) => {
    const maxForType = Math.max(
      1,
      ...weekDates.map(date => getMealsForSlot(date, type).length)
    );
    acc[type] = maxForType;
    return acc;
  }, {} as Record<MealType, number>);

  // Calculate min height based on number of meals (each meal card ~60px + header ~30px + padding)
  const getMinHeight = (mealType: MealType) => {
    const maxMeals = maxMealsPerType[mealType];
    return maxMeals === 0 ? 100 : 30 + (maxMeals * 60);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planning de la semaine</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[200px] text-center">
            Semaine du {formatDisplayDate(formatDate(weekStart))}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Detail Dialog - Shows all recipes in a meal slot */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSlot && (
                <>
                  {MEAL_TYPES.find((m) => m.type === selectedSlot.mealType)?.label}
                  <span className="font-normal text-muted-foreground ml-2">
                    {formatFullDate(selectedSlot.date)}
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {currentSlotMeals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune recette pour ce repas
              </p>
            ) : (
              <div className="space-y-2">
                {currentSlotMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className={`p-3 rounded-lg border ${
                      meal.is_prepared
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 min-w-0 cursor-pointer hover:opacity-70"
                        onClick={() => openRecipeDialog(meal)}
                      >
                        <p className="font-medium flex items-center gap-2">
                          <ChefHat className="h-4 w-4 text-muted-foreground" />
                          {meal.recipe?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryBadge(meal.recipe?.category as Category)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {meal.servings} personnes
                          </span>
                          {meal.is_prepared && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                              Préparé
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!meal.is_prepared && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleMarkPrepared(meal.id)}
                            title="Marquer comme préparé"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(meal)}
                          title="Modifier les portions"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(meal.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={openAddDialog} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une recette
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recipe Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choisir une recette</DialogTitle>
          </DialogHeader>

          {/* Search and filters */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une recette..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={recipeCategoryFilter} onValueChange={setRecipeCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipe grid */}
          <div className="flex-1 overflow-y-auto mt-4">
            {selectedSlot && getFilteredRecipes(selectedSlot.mealType).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune recette trouvée
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {selectedSlot && getFilteredRecipes(selectedSlot.mealType).map((recipe) => (
                  <Card
                    key={recipe.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
                    onClick={() => openServingsDialog(recipe)}
                  >
                    <div className="flex h-28">
                      <div className="flex-1 min-w-0 flex flex-col p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{recipe.name}</h3>
                        <Badge className="w-fit mt-1 text-xs">{getCategoryBadge(recipe.category)}</Badge>
                        {(recipe.prep_time || recipe.cook_time) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {recipe.prep_time && `${recipe.prep_time}min`}
                            {recipe.prep_time && recipe.cook_time && " + "}
                            {recipe.cook_time && `${recipe.cook_time}min`}
                          </p>
                        )}
                      </div>
                      {recipe.image_path && (
                        <div className="w-28 h-28 flex-shrink-0">
                          <img
                            src={recipe.image_path}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Servings Dialog */}
      <Dialog open={servingsDialogOpen} onOpenChange={setServingsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nombre de portions</DialogTitle>
          </DialogHeader>
          {selectedRecipeForServings && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {selectedRecipeForServings.image_path && (
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={selectedRecipeForServings.image_path}
                      alt={selectedRecipeForServings.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium line-clamp-2">{selectedRecipeForServings.name}</p>
                  <Badge className="mt-1 text-xs">{getCategoryBadge(selectedRecipeForServings.category)}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pour combien de personnes ?</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setServingsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmServings}>
                  Ajouter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Servings Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les portions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingMeal && (
              <p className="text-muted-foreground">
                {editingMeal.recipe?.name}
              </p>
            )}
            <div className="space-y-2">
              <Label>Nombre de personnes</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={editServings}
                onChange={(e) => setEditServings(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateServings}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Preparation Sheet Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRecipeDialogOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <ChefHat className="h-5 w-5" />
              Fiche de préparation
            </DialogTitle>
          </DialogHeader>

          {loadingRecipe ? (
            <div className="text-center py-12">Chargement...</div>
          ) : recipeDetails && selectedMealForRecipe ? (
            <div className="space-y-6">
              {/* Recipe header */}
              <div>
                <h2 className="text-2xl font-bold">{recipeDetails.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge>{getCategoryBadge(recipeDetails.category)}</Badge>
                  <Badge variant="outline" className="text-base">
                    {selectedMealForRecipe.servings} personnes
                  </Badge>
                  {recipeDetails.prep_time && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Prépa: {recipeDetails.prep_time} min
                    </span>
                  )}
                  {recipeDetails.cook_time && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Cuisson: {recipeDetails.cook_time} min
                    </span>
                  )}
                </div>
                {recipeDetails.source_book && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Source: {recipeDetails.source_book}
                    {recipeDetails.source_page && `, p.${recipeDetails.source_page}`}
                  </p>
                )}
              </div>

              {/* Ingredients */}
              {recipeDetails.ingredients && recipeDetails.ingredients.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ingrédients</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recipeDetails.ingredients.map((ing, idx) => {
                      const ratio = selectedMealForRecipe.servings / recipeDetails.base_servings;
                      const adjustedQty = Math.round(ing.quantity * ratio * 10) / 10;
                      const adjustedNormalized = Math.round(ing.quantity_normalized * ratio * 10) / 10;
                      const rawUnit = ing.unit_display || ing.unit_normalized || '';
                      const displayUnit = ['pièce', 'pièces', 'piece'].includes(rawUnit.toLowerCase()) ? '' : rawUnit;
                      // Afficher la quantité normalisée si différente et pas en pièces
                      const showNormalized = ing.unit_normalized !== 'piece' &&
                        (displayUnit !== ing.unit_normalized && displayUnit !== '');
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {adjustedQty} {displayUnit}
                            </span>
                            <span>{ing.ingredient_name}</span>
                          </div>
                          {showNormalized && (
                            <span className="text-xs text-muted-foreground">
                              {adjustedNormalized}{ing.unit_normalized}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {recipeDetails.instructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{recipeDetails.instructions}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {recipeDetails.tags && recipeDetails.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipeDetails.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Impossible de charger la recette
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
