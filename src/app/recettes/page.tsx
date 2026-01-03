"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as api from "@/lib/api";
import { RECIPE_CATEGORIES, SEASONS } from "@/lib/constants";
import { RecipeDetailDialog, EditIngredient } from "./components";
import type { Recipe, Category, Season } from "@/types";

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");

  // Detail dialog
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadRecipeId, setPendingUploadRecipeId] = useState<number | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("plat");
  const [editServings, setEditServings] = useState("");
  const [editPrepTime, setEditPrepTime] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIngredients, setEditIngredients] = useState<EditIngredient[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecipes({
        search: search || undefined,
        category: categoryFilter !== "all" ? (categoryFilter as Category) : undefined,
        season: seasonFilter !== "all" ? (seasonFilter as Season) : undefined,
      });
      setRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, [search, categoryFilter, seasonFilter]);

  const openCreateDialog = () => {
    setSelectedRecipe(null);
    setIsCreating(true);
    setEditMode(true);
    setEditName("");
    setEditCategory("plat");
    setEditServings("4");
    setEditPrepTime("");
    setEditCookTime("");
    setEditInstructions("");
    setEditIngredients([]);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette recette ?")) return;
    try {
      await api.deleteRecipe(id);
      setDetailDialogOpen(false);
      await loadRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  const handleImageButtonClick = (recipeId: number) => {
    setPendingUploadRecipeId(recipeId);
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadRecipeId) return;

    setUploadingImageId(pendingUploadRecipeId);
    try {
      await api.uploadRecipeImage(pendingUploadRecipeId, file);
      await loadRecipes();
      if (selectedRecipe?.id === pendingUploadRecipeId) {
        const updated = await api.getRecipe(pendingUploadRecipeId);
        if (updated) setSelectedRecipe(updated);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImageId(null);
      setPendingUploadRecipeId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const viewRecipeDetails = async (id: number) => {
    try {
      const recipe = await api.getRecipe(id);
      if (recipe) {
        setSelectedRecipe(recipe);
        setIsCreating(false);
        setEditMode(false);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading recipe:", error);
    }
  };

  const startEditMode = () => {
    if (!selectedRecipe) return;
    setEditName(selectedRecipe.name);
    setEditCategory(selectedRecipe.category);
    setEditServings(selectedRecipe.base_servings.toString());
    setEditPrepTime(selectedRecipe.prep_time?.toString() || "");
    setEditCookTime(selectedRecipe.cook_time?.toString() || "");
    setEditInstructions(selectedRecipe.instructions || "");
    setEditIngredients(
      (selectedRecipe.ingredients || []).map((ing) => ({
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity.toString(),
        unit_display: ing.unit_display,
        quantity_normalized: ing.quantity_normalized.toString(),
        unit_normalized: ing.unit_normalized,
      }))
    );
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setIsCreating(false);
    if (isCreating) {
      setDetailDialogOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        // Create new recipe
        const newId = await api.createRecipe({
          name: editName,
          category: editCategory,
          base_servings: parseInt(editServings) || 4,
          prep_time: editPrepTime ? parseInt(editPrepTime) : null,
          cook_time: editCookTime ? parseInt(editCookTime) : null,
          instructions: editInstructions || null,
          seasons: [],
          tags: [],
          ingredients: editIngredients.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 0,
            unit_display: ing.unit_display,
            quantity_normalized: parseFloat(ing.quantity_normalized) || 0,
            unit_normalized: ing.unit_normalized as "g" | "ml" | "piece",
          })),
        });
        // Open the newly created recipe
        const newRecipe = await api.getRecipe(newId);
        if (newRecipe) {
          setSelectedRecipe(newRecipe);
          setIsCreating(false);
          setEditMode(false);
        }
        await loadRecipes();
      } else if (selectedRecipe) {
        // Update existing recipe
        await api.updateRecipe(selectedRecipe.id, {
          name: editName,
          category: editCategory,
          base_servings: parseInt(editServings) || 4,
          prep_time: editPrepTime ? parseInt(editPrepTime) : null,
          cook_time: editCookTime ? parseInt(editCookTime) : null,
          instructions: editInstructions || null,
          ingredients: editIngredients.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 0,
            unit_display: ing.unit_display,
            quantity_normalized: parseFloat(ing.quantity_normalized) || 0,
            unit_normalized: ing.unit_normalized as "g" | "ml" | "piece",
          })),
        });
        const updated = await api.getRecipe(selectedRecipe.id);
        if (updated) setSelectedRecipe(updated);
        setEditMode(false);
        await loadRecipes();
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <h1 className="hidden md:block text-3xl font-bold">Recettes</h1>

      {/* Search and filters - fixed on mobile */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-white dark:bg-zinc-950 shadow-md px-4 pt-3 pb-3 md:relative md:top-auto md:z-auto md:shadow-none md:bg-transparent md:px-0 md:pt-0 md:pb-0">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={openCreateDialog} size="icon" className="shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 md:w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {RECIPE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="flex-1 md:w-[180px]">
                <SelectValue placeholder="Saison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes saisons</SelectItem>
                {SEASONS.map((season) => (
                  <SelectItem key={season.value} value={season.value}>{season.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Spacer for fixed search bar on mobile */}
      <div className="h-[100px] md:hidden" />

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune recette trouvée</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une recette
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => viewRecipeDetails(recipe.id)}
            >
              <div className="flex h-32 md:h-44">
                <div className="flex-1 min-w-0 flex flex-col gap-2 md:gap-3 p-3 md:p-4">
                  <h3 className="font-semibold text-base md:text-lg line-clamp-2">{recipe.name}</h3>
                  <CategoryBadge category={recipe.category} className="w-fit text-xs" />
                  {(recipe.prep_time || recipe.cook_time) && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {recipe.prep_time && `${recipe.prep_time}min`}
                      {recipe.prep_time && recipe.cook_time && " + "}
                      {recipe.cook_time && `${recipe.cook_time}min`}
                    </p>
                  )}
                </div>
                {recipe.image_path && (
                  <div className="w-32 h-32 md:w-44 md:h-44 flex-shrink-0">
                    <img src={recipe.image_path} alt={recipe.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RecipeDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        recipe={selectedRecipe}
        editMode={editMode}
        isCreating={isCreating}
        onStartEdit={startEditMode}
        onDelete={() => selectedRecipe && handleDelete(selectedRecipe.id)}
        onImageUpload={() => selectedRecipe && handleImageButtonClick(selectedRecipe.id)}
        uploadingImage={uploadingImageId === selectedRecipe?.id}
        editName={editName}
        setEditName={setEditName}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editServings={editServings}
        setEditServings={setEditServings}
        editPrepTime={editPrepTime}
        setEditPrepTime={setEditPrepTime}
        editCookTime={editCookTime}
        setEditCookTime={setEditCookTime}
        editInstructions={editInstructions}
        setEditInstructions={setEditInstructions}
        editIngredients={editIngredients}
        setEditIngredients={setEditIngredients}
        onSave={handleSaveEdit}
        onCancelEdit={cancelEdit}
        isSaving={isSaving}
      />
    </div>
  );
}
