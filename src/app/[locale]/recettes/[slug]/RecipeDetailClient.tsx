"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeft, ImagePlus, Pencil, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge, IngredientLine, LoadingSpinner } from "@/components/common";
import { VisibilityBadge } from "../components/VisibilitySelector";
import { formatDuration } from "@/lib/utils";
import { getTranslatedName, getTranslatedInstructions } from "@/lib/utils/translations";
import { getRecipe, deleteRecipe, uploadRecipeImage } from "@/lib/api/recipes";
import { useAuth } from "@/lib/auth";
import type { Recipe } from "@/types";
import type { Locale } from "@/i18n/routing";

interface RecipeDetailClientProps {
  recipeId: number;
}

export default function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      if (isNaN(recipeId)) {
        setError("Invalid recipe ID");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getRecipe(recipeId);
        if (data) {
          setRecipe(data);
        } else {
          setError("Recipe not found");
        }
      } catch (err) {
        console.error("Error loading recipe:", err);
        setError("Error loading recipe");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipe();
  }, [recipeId]);

  const isOwner = user && recipe?.user_id === user.id;

  // Get translated content
  const recipeName = recipe
    ? getTranslatedName(recipe.translations, recipe.name, locale)
    : "";
  const recipeInstructions = recipe
    ? getTranslatedInstructions(recipe.translations, recipe.instructions, locale)
    : null;

  const handleDelete = async () => {
    if (!recipe || !confirm(t("recipes.deleteRecipe"))) return;

    try {
      await deleteRecipe(recipe.id);
      router.push("/recettes");
    } catch (err) {
      console.error("Error deleting recipe:", err);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !recipe) return;

    setUploadingImage(true);
    try {
      const newImagePath = await uploadRecipeImage(recipe.id, file);
      setRecipe({ ...recipe, image_path: newImagePath });
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = () => {
    router.push(`/recettes?edit=${recipe?.id}`);
  };

  const handleShare = async () => {
    if (!recipe) return;

    const url = window.location.href;
    const title = recipeName;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      alert(t("common.copiedToClipboard"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="space-y-4">
        <Link href="/recettes" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || t("recipes.loadError")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Back button */}
      <Link href="/recettes" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      {/* Recipe title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{recipeName}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <CategoryBadge category={recipe.category} />
          <VisibilityBadge visibility={recipe.visibility} />
        </div>
      </div>

      {/* Desktop: 3 columns (Info | Ingredients | Image) - Mobile: stacked */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-8">
        {/* General info - 1/3 */}
        <div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="text-base font-medium text-foreground">{recipe.base_servings} {t("recipes.persons")}</p>
            {recipe.prep_time && (
              <p>{t("recipes.preparation")} : {formatDuration(recipe.prep_time)}</p>
            )}
            {recipe.cook_time && (
              <p>{t("recipes.cooking")} : {formatDuration(recipe.cook_time)}</p>
            )}
            {recipe.repos_time && (
              <p>{t("recipes.resting")} : {formatDuration(recipe.repos_time)}</p>
            )}
          </div>
        </div>

        {/* Ingredients - 1/3 */}
        <div>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3">{t("recipes.ingredients")}</h2>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, idx) => (
                  <IngredientLine
                    key={idx}
                    ingredientId={ing.ingredient_id}
                    ingredientName={ing.ingredient_name}
                    quantity={ing.quantity}
                    unit={ing.unit}
                    translations={ing.ingredient_translations}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Image - 1/3 */}
        <div className="order-first md:order-last">
          {recipe.image_path && (
            <div className="w-full aspect-square rounded-lg overflow-hidden">
              <img
                src={recipe.image_path}
                alt={recipeName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {recipeInstructions && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{t("recipes.instructions")}</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
            {recipeInstructions}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            {t("common.share")}
          </Button>

          {isOwner && (
            <>
              <Button variant="outline" onClick={handleImageUpload} disabled={uploadingImage}>
                {uploadingImage ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <ImagePlus className="h-4 w-4 mr-2" />
                )}
                {recipe.image_path ? t("recipes.changeImage") : t("recipes.addImage")}
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("common.edit")}
              </Button>
            </>
          )}
        </div>

        {isOwner && (
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
