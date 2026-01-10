"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getRecipeSlug } from "@/lib/utils/slug";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Locale } from "@/i18n/routing";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as api from "@/lib/api";
import { updateRecipeVisibility } from "@/lib/api/recipes";
import { formatDuration } from "@/lib/utils";
import { RECIPE_CATEGORIES, SEASONS } from "@/lib/constants";
import { RecipeDetailDialog, EditIngredient, ShareDialog } from "./components";
import { useAuth } from "@/lib/auth";
import type { Recipe, Category, Season, RecipeVisibility, Ingredient } from "@/types";

function RecettesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const searchParams = useSearchParams();
  const ingredientIdParam = searchParams.get("ingredient");
  const editIdParam = searchParams.get("edit");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [ingredientFilter, setIngredientFilter] = useState<Ingredient | null>(null);

  // Detail dialog
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadRecipeId, setPendingUploadRecipeId] = useState<number | null>(null);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("plat");
  const [editServings, setEditServings] = useState("");
  const [editPrepTime, setEditPrepTime] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editReposTime, setEditReposTime] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIngredients, setEditIngredients] = useState<EditIngredient[]>([]);
  const [editVisibility, setEditVisibility] = useState<RecipeVisibility>("private");
  const [isSaving, setIsSaving] = useState(false);

  // Check if current user is the owner of the selected recipe
  const isOwner = selectedRecipe?.user_id === user?.id || isCreating;

  // Load ingredient info when URL param changes
  useEffect(() => {
    if (ingredientIdParam) {
      api.getIngredients().then((ingredients) => {
        const found = ingredients.find((i) => i.id === parseInt(ingredientIdParam));
        setIngredientFilter(found || null);
      });
    } else {
      setIngredientFilter(null);
    }
  }, [ingredientIdParam]);

  // Handle edit parameter from URL (coming from recipe detail page)
  useEffect(() => {
    if (editIdParam) {
      api.getRecipe(parseInt(editIdParam)).then((recipe) => {
        if (recipe) {
          setSelectedRecipe(recipe);
          setIsCreating(false);
          setEditMode(true);
          setEditName(recipe.name);
          setEditCategory(recipe.category);
          setEditServings(recipe.base_servings.toString());
          setEditPrepTime(recipe.prep_time?.toString() || "");
          setEditCookTime(recipe.cook_time?.toString() || "");
          setEditReposTime(recipe.repos_time?.toString() || "");
          setEditInstructions(recipe.instructions || "");
          setEditVisibility(recipe.visibility);
          setEditIngredients(
            (recipe.ingredients || []).map((ing) => ({
              ingredient_id: ing.ingredient_id,
              ingredient_name: ing.ingredient_name,
              quantity: ing.quantity.toString(),
              unit_id: ing.unit_id,
            }))
          );
          setDetailDialogOpen(true);
        }
      });
      // Clear the edit param from URL
      router.replace("/recettes");
    }
  }, [editIdParam]);

  const clearIngredientFilter = () => {
    router.push("/recettes");
  };

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecipes({
        search: search || undefined,
        category: categoryFilter !== "all" ? (categoryFilter as Category) : undefined,
        season: seasonFilter !== "all" ? (seasonFilter as Season) : undefined,
        ingredientId: ingredientIdParam ? parseInt(ingredientIdParam) : undefined,
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
  }, [search, categoryFilter, seasonFilter, ingredientIdParam]);

  const openCreateDialog = () => {
    setSelectedRecipe(null);
    setIsCreating(true);
    setEditMode(true);
    setEditName("");
    setEditCategory("plat");
    setEditServings("4");
    setEditPrepTime("");
    setEditCookTime("");
    setEditReposTime("");
    setEditInstructions("");
    setEditIngredients([]);
    setEditVisibility("private");
    setDetailDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('recipes.deleteRecipe'))) return;
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
      alert(t('recipes.uploadError'));
    } finally {
      setUploadingImageId(null);
      setPendingUploadRecipeId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const viewRecipeDetails = (recipe: Recipe) => {
    const slug = getRecipeSlug(recipe.id, recipe.name, recipe.translations, locale);
    router.push(`/recettes/${slug}`);
  };

  const startEditMode = () => {
    if (!selectedRecipe) return;
    setEditName(selectedRecipe.name);
    setEditCategory(selectedRecipe.category);
    setEditServings(selectedRecipe.base_servings.toString());
    setEditPrepTime(selectedRecipe.prep_time?.toString() || "");
    setEditCookTime(selectedRecipe.cook_time?.toString() || "");
    setEditReposTime(selectedRecipe.repos_time?.toString() || "");
    setEditInstructions(selectedRecipe.instructions || "");
    setEditVisibility(selectedRecipe.visibility || "private");
    setEditIngredients(
      (selectedRecipe.ingredients || []).map((ing) => ({
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity.toString(),
        unit_id: ing.unit_id,
        unit: ing.unit,
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
          repos_time: editReposTime ? parseInt(editReposTime) : null,
          instructions: editInstructions || null,
          seasons: [],
          tags: [],
          visibility: editVisibility,
          ingredients: editIngredients.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 0,
            unit_id: ing.unit_id,
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
          repos_time: editReposTime ? parseInt(editReposTime) : null,
          instructions: editInstructions || null,
          ingredients: editIngredients.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            quantity: parseFloat(ing.quantity) || 0,
            unit_id: ing.unit_id,
          })),
        });
        // Update visibility separately if changed
        if (editVisibility !== selectedRecipe.visibility) {
          await updateRecipeVisibility(selectedRecipe.id, editVisibility);
        }
        const updated = await api.getRecipe(selectedRecipe.id);
        if (updated) setSelectedRecipe(updated);
        setEditMode(false);
        await loadRecipes();
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert(t('recipes.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Desktop title */}
      <h1 className="hidden md:block text-3xl font-bold mb-6">{t('recipes.title')}</h1>

      {/* Search and filters - fixed on mobile at top-14 (56px), right under header */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-background border-b px-4 py-3 md:relative md:top-auto md:z-auto md:border-none md:px-0 md:py-0 md:mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
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
                <SelectValue placeholder={t('recipes.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('recipes.allCategories')}</SelectItem>
                {RECIPE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{t(`categories.${cat.value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="flex-1 md:w-[180px]">
                <SelectValue placeholder={t('recipes.season')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('recipes.allSeasons')}</SelectItem>
                {SEASONS.map((season) => (
                  <SelectItem key={season.value} value={season.value}>{t(`seasons.${season.value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Spacer for fixed search bar on mobile - exact height of search bar */}
      <div className="h-[108px] md:hidden" />

      {/* Ingredient filter badge */}
      {ingredientFilter && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm py-1 px-3 gap-2">
            {t('recipes.recipesWith')} {ingredientFilter.name}
            <button onClick={clearIngredientFilter} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('recipes.noRecipes')}</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('recipes.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const recipeName = getTranslatedName(recipe.translations, recipe.name, locale);
            return (
              <Card
                key={recipe.id}
                className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                onClick={() => viewRecipeDetails(recipe)}
              >
                <div className="flex h-32 md:h-44">
                  <div className="flex-1 min-w-0 flex flex-col gap-2 md:gap-3 p-3 md:p-4">
                    <h3 className="font-semibold text-base md:text-lg line-clamp-2">{recipeName}</h3>
                    <CategoryBadge category={recipe.category} className="w-fit text-xs" />
                    {(recipe.prep_time || recipe.cook_time || recipe.repos_time) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
                        {recipe.prep_time && (
                          <span className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-black text-white text-[10px] md:text-xs font-medium">{t('recipes.prepAbbr')}</span>
                            {formatDuration(recipe.prep_time)}
                          </span>
                        )}
                        {recipe.cook_time && (
                          <span className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-black text-white text-[10px] md:text-xs font-medium">{t('recipes.cookAbbr')}</span>
                            {formatDuration(recipe.cook_time)}
                          </span>
                        )}
                        {recipe.repos_time && (
                          <span className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-black text-white text-[10px] md:text-xs font-medium">{t('recipes.restAbbr')}</span>
                            {formatDuration(recipe.repos_time)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {recipe.image_path && (
                    <div className="w-32 h-32 md:w-44 md:h-44 flex-shrink-0">
                      <img src={recipe.image_path} alt={recipeName} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RecipeDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        recipe={selectedRecipe}
        editMode={editMode}
        isCreating={isCreating}
        isOwner={isOwner}
        onStartEdit={startEditMode}
        onDelete={() => selectedRecipe && handleDelete(selectedRecipe.id)}
        onImageUpload={() => selectedRecipe && handleImageButtonClick(selectedRecipe.id)}
        uploadingImage={uploadingImageId === selectedRecipe?.id}
        onOpenShareDialog={() => setShareDialogOpen(true)}
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
        editReposTime={editReposTime}
        setEditReposTime={setEditReposTime}
        editInstructions={editInstructions}
        setEditInstructions={setEditInstructions}
        editIngredients={editIngredients}
        setEditIngredients={setEditIngredients}
        editVisibility={editVisibility}
        setEditVisibility={setEditVisibility}
        onSave={handleSaveEdit}
        onCancelEdit={cancelEdit}
        isSaving={isSaving}
      />

      {selectedRecipe && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          recipeId={selectedRecipe.id}
          recipeName={selectedRecipe.name}
        />
      )}
    </>
  );
}

export default function RecettesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">...</div>}>
      <RecettesPageContent />
    </Suspense>
  );
}
