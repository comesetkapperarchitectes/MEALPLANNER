"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ChefHat, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/common";
import { formatDuration } from "@/lib/utils";
import { formatUnit, getArticle } from "@/lib/utils/unitUtils";
import { getTranslatedName, getTranslatedInstructions } from "@/lib/utils/translations";
import type { Recipe, MealPlan } from "@/types";
import type { Locale } from "@/i18n/routing";

interface RecipeSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  meal: MealPlan | null;
  loading: boolean;
}

export function RecipeSheetDialog({
  open,
  onOpenChange,
  recipe,
  meal,
  loading,
}: RecipeSheetDialogProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  // Get translated content
  const recipeName = recipe ? getTranslatedName(recipe.translations, recipe.name, locale) : '';
  const recipeInstructions = recipe ? getTranslatedInstructions(recipe.translations, recipe.instructions, locale) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full md:w-auto md:h-auto md:max-w-2xl md:max-h-[85vh] rounded-none md:rounded-lg inset-0 md:inset-auto translate-x-0 translate-y-0 md:-translate-x-1/2 md:-translate-y-1/2 md:left-1/2 md:top-1/2 overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-2 border-b md:border-none">
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ChefHat className="h-5 w-5" />
            {t('recipes.preparationSheet')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : recipe && meal ? (
          <div className="space-y-4">
            {/* Recipe image */}
            {recipe.image_path && (
              <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden">
                <img
                  src={recipe.image_path}
                  alt={recipeName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Recipe header */}
            <div>
              <h2 className="text-lg md:text-xl font-bold">{recipeName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <CategoryBadge category={recipe.category} className="text-xs" />
                <Badge variant="outline" className="text-xs">
                  {meal.servings} {t('recipes.persons')}
                </Badge>
                {recipe.prep_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-medium">{t('recipes.prepAbbr')}</span>
                    {formatDuration(recipe.prep_time)}
                  </span>
                )}
                {recipe.cook_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-medium">{t('recipes.cookAbbr')}</span>
                    {formatDuration(recipe.cook_time)}
                  </span>
                )}
                {recipe.repos_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-medium">{t('recipes.restAbbr')}</span>
                    {formatDuration(recipe.repos_time)}
                  </span>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('recipes.ingredients')}</h3>
                <div className="grid gap-1 sm:grid-cols-2">
                  {recipe.ingredients.map((ing, idx) => {
                    const ratio = meal.servings / recipe.base_servings;
                    const adjustedQty = Math.round(ing.quantity * ratio * 10) / 10;
                    const unitStr = formatUnit(ing.unit, adjustedQty, locale);
                    const ingredientName = getTranslatedName(ing.ingredient_translations, ing.ingredient_name, locale);
                    const article = getArticle(ing.unit, ingredientName, locale);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {adjustedQty} {unitStr}
                          </span>
                          <span>{article}{ingredientName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructions */}
            {recipeInstructions && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('recipes.instructions')}</h3>
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">{recipeInstructions}</p>
              </div>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t('recipes.loadError')}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
