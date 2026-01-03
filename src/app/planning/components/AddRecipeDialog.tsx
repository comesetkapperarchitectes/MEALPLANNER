"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { RECIPE_CATEGORIES } from "@/lib/constants";
import type { Recipe, Category } from "@/types";

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  getCategoryBadge: (category: Category) => string;
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
  getCategoryBadge,
}: AddRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choisir une recette</DialogTitle>
        </DialogHeader>

        {/* Search and filters */}
        <div className="flex gap-4 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une recette..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {RECIPE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipe grid */}
        <div className="flex-1 overflow-y-auto mt-4">
          {recipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune recette trouvée
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
                  onClick={() => onSelectRecipe(recipe)}
                >
                  <div className="flex h-28">
                    <div className="flex-1 min-w-0 flex flex-col p-3">
                      <h3 className="font-medium text-sm line-clamp-2">{recipe.name}</h3>
                      <Badge className="w-fit mt-1 text-xs">{getCategoryBadge(recipe.category)}</Badge>
                      {(recipe.prep_time || recipe.cook_time) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {recipe.prep_time && `${recipe.prep_time}min`}
                          {recipe.prep_time && recipe.cook_time && " + "}
                          {recipe.cook_time && `${recipe.cook_time}min`}
                        </p>
                      )}
                    </div>
                    {recipe.image_path && (
                      <div className="w-28 h-28 flex-shrink-0">
                        <img
                          src={recipe.image_path}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
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
