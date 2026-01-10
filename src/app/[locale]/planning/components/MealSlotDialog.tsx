"use client";

import { useLocale, useTranslations } from "next-intl";
import { Plus, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/common";
import { getTranslatedName } from "@/lib/utils/translations";
import type { MealPlan, MealType, Category } from "@/types";
import type { Locale } from "@/i18n/routing";

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
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md top-[10%] translate-y-0 md:top-[50%] md:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle>
            {selectedSlot && (
              <>
                {t(`mealTypes.${selectedSlot.mealType}`)}
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
              {t('planning.noMeals')}
            </p>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`rounded-lg border overflow-hidden ${
                    meal.is_prepared
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex h-20">
                    {meal.recipe?.image_path && (
                      <div
                        className="w-20 flex-shrink-0 cursor-pointer"
                        onClick={() => onOpenRecipe(meal)}
                      >
                        <img
                          src={meal.recipe.image_path}
                          alt={meal.recipe.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className="flex-1 p-2 min-w-0 cursor-pointer hover:opacity-70 flex flex-col justify-center"
                      onClick={() => onOpenRecipe(meal)}
                    >
                      <p className="font-medium line-clamp-1">
                        {getTranslatedName(meal.recipe?.translations, meal.recipe?.name || '', locale)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <CategoryBadge
                          category={meal.recipe?.category as Category}
                          className="text-xs"
                        />
                        <span className="text-sm text-muted-foreground">
                          {meal.servings} {t('recipes.persons')}
                        </span>
                        {meal.is_prepared && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                            {t('planning.prepared')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 p-2">
                      {!meal.is_prepared && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onMarkPrepared(meal.id)}
                          title={t('planning.markPrepared')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onEditMeal(meal)}
                        title={t('planning.editServings')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemoveMeal(meal.id)}
                        title={t('common.delete')}
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
            {t('planning.addMeal')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
