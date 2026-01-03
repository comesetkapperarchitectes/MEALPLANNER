"use client";

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
import { formatUnitDisplay } from "@/lib/utils/unitUtils";
import type { Recipe, MealPlan } from "@/types";

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
            Fiche de préparation
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : recipe && meal ? (
          <div className="space-y-4">
            {/* Recipe image */}
            {recipe.image_path && (
              <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden">
                <img
                  src={recipe.image_path}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Recipe header */}
            <div>
              <h2 className="text-lg md:text-xl font-bold">{recipe.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <CategoryBadge category={recipe.category} className="text-xs" />
                <Badge variant="outline" className="text-xs">
                  {meal.servings} pers.
                </Badge>
                {recipe.prep_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {recipe.prep_time} min
                  </span>
                )}
                {recipe.cook_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {recipe.cook_time} min cuisson
                  </span>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Ingrédients</h3>
                <div className="grid gap-1 sm:grid-cols-2">
                  {recipe.ingredients.map((ing, idx) => {
                    const ratio = meal.servings / recipe.base_servings;
                    const adjustedQty = Math.round(ing.quantity * ratio * 10) / 10;
                    const adjustedNormalized = Math.round(ing.quantity_normalized * ratio * 10) / 10;
                    const { displayUnit, showNormalized } = formatUnitDisplay(
                      ing.unit_display || ing.unit_normalized || '',
                      ing.unit_normalized
                    );
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {adjustedQty} {displayUnit}
                          </span>
                          <span>{ing.ingredient_name}</span>
                        </div>
                        {showNormalized && (
                          <span className="text-[10px] text-muted-foreground">
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
            {recipe.instructions && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Instructions</h3>
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">{recipe.instructions}</p>
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
            Impossible de charger la recette
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
