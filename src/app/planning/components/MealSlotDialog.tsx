"use client";

import { Plus, Check, Pencil, Trash2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/common";
import { MEAL_TYPES } from "@/lib/constants";
import type { MealPlan, MealType, Category } from "@/types";

interface MealSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlot: { date: string; mealType: MealType } | null;
  meals: MealPlan[];
  onAddRecipe: () => void;
  onEditMeal: (meal: MealPlan) => void;
  onRemoveMeal: (mealId: number) => void;
  onMarkPrepared: (mealId: number) => void;
  onOpenRecipe: (meal: MealPlan) => void;
  formatFullDate: (dateStr: string) => string;
}

export function MealSlotDialog({
  open,
  onOpenChange,
  selectedSlot,
  meals,
  onAddRecipe,
  onEditMeal,
  onRemoveMeal,
  onMarkPrepared,
  onOpenRecipe,
  formatFullDate,
}: MealSlotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune recette pour ce repas
            </p>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
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
                      onClick={() => onOpenRecipe(meal)}
                    >
                      <p className="font-medium flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        {meal.recipe?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryBadge
                          category={meal.recipe?.category as Category}
                          className="text-xs"
                        />
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
                          onClick={() => onMarkPrepared(meal.id)}
                          title="Marquer comme préparé"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onEditMeal(meal)}
                        title="Modifier les portions"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemoveMeal(meal.id)}
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

          <Button onClick={onAddRecipe} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une recette
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
