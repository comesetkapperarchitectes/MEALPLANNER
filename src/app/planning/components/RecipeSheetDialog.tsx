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
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
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
          <div className="space-y-6">
            {/* Recipe header */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{recipe.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <CategoryBadge category={recipe.category} />
                <Badge variant="outline" className="text-base">
                  {meal.servings} personnes
                </Badge>
                {recipe.prep_time && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Prépa: {recipe.prep_time} min
                  </span>
                )}
                {recipe.cook_time && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Cuisson: {recipe.cook_time} min
                  </span>
                )}
              </div>
              {recipe.source_book && (
                <p className="text-sm text-muted-foreground mt-2">
                  Source: {recipe.source_book}
                  {recipe.source_page && `, p.${recipe.source_page}`}
                </p>
              )}
            </div>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Ingrédients</h3>
                <div className="grid gap-2 sm:grid-cols-2">
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
            {recipe.instructions && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{recipe.instructions}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
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
  );
}
