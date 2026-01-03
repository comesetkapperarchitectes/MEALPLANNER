"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Upload } from "lucide-react";
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
import { ImportDialog, RecipeDetailDialog, EditIngredient } from "./components";
import type { Recipe, Category, Season, RecipeImport } from "@/types";

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importError, setImportError] = useState("");

  // Detail dialog
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

  const handleImport = async () => {
    setImportError("");
    try {
      const parsed = JSON.parse(jsonInput);
      let recipesToImport: RecipeImport[];
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        recipesToImport = parsed.recipes;
      } else if (Array.isArray(parsed)) {
        recipesToImport = parsed;
      } else {
        recipesToImport = [parsed];
      }
      await api.importRecipes(recipesToImport);
      setJsonInput("");
      setImportDialogOpen(false);
      await loadRecipes();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Erreur d'import");
    }
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

  const cancelEdit = () => setEditMode(false);

  const handleSaveEdit = async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    try {
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
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recettes</h1>
        <Button onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer JSON
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
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

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune recette trouvée</p>
            <Button className="mt-4" onClick={() => setImportDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Importer des recettes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => viewRecipeDetails(recipe.id)}
            >
              <div className="flex h-44">
                <div className="flex-1 min-w-0 flex flex-col gap-3 p-4">
                  <h3 className="font-semibold text-lg line-clamp-2">{recipe.name}</h3>
                  <CategoryBadge category={recipe.category} className="w-fit" />
                  {(recipe.prep_time || recipe.cook_time) && (
                    <p className="text-sm text-muted-foreground">
                      {recipe.prep_time && `Prépa: ${recipe.prep_time}min`}
                      {recipe.prep_time && recipe.cook_time && " • "}
                      {recipe.cook_time && `Cuisson: ${recipe.cook_time}min`}
                    </p>
                  )}
                </div>
                {recipe.image_path && (
                  <div className="w-44 h-44 flex-shrink-0">
                    <img src={recipe.image_path} alt={recipe.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        jsonInput={jsonInput}
        onJsonInputChange={setJsonInput}
        onImport={handleImport}
        error={importError}
      />

      <RecipeDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        recipe={selectedRecipe}
        editMode={editMode}
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
