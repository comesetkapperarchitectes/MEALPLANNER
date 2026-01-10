"use client";

import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CategoryBadge } from "@/components/common";
import { RECIPE_CATEGORIES } from "@/lib/constants";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Recipe } from "@/types";
import type { Locale } from "@/i18n/routing";

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  recipes,
  searchValue,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onSelectRecipe,
}: AddRecipeDialogProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] md:max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('planning.chooseRecipe')}</DialogTitle>
        </DialogHeader>

        {/* Search and filters - stack on mobile */}
        <div className="flex flex-col gap-2 md:flex-row md:gap-4 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('recipes.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('recipes.allCategories')}</SelectItem>
              {RECIPE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(`categories.${cat.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipe grid */}
        <div className="flex-1 overflow-y-auto mt-4 -mx-2 px-2">
          {recipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('recipes.noRecipes')}
            </div>
          ) : (
            <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50 active:ring-2 active:ring-primary/50"
                  onClick={() => onSelectRecipe(recipe)}
                >
                  <div className="flex h-24 md:h-28">
                    <div className="flex-1 min-w-0 flex flex-col p-2 md:p-3">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {getTranslatedName(recipe.translations, recipe.name, locale)}
                      </h3>
                      <CategoryBadge category={recipe.category} className="w-fit mt-1 text-xs" />
                      {(recipe.prep_time || recipe.cook_time) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {recipe.prep_time && `${recipe.prep_time}min`}
                          {recipe.prep_time && recipe.cook_time && " + "}
                          {recipe.cook_time && `${recipe.cook_time}min`}
                        </p>
                      )}
                    </div>
                    {recipe.image_path && (
                      <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
                        <img
                          src={recipe.image_path}
                          alt={recipe.name}
                          className="w-full h-full object-cover rounded-r-lg"
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
  );
}
