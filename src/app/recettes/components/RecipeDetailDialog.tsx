"use client";

import { ImagePlus, Pencil, Trash2, Save, X, Users } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryBadge, IngredientLine, LoadingSpinner } from "@/components/common";
import { RECIPE_CATEGORIES } from "@/lib/constants";
import { SortableIngredient, EditIngredient } from "./SortableIngredient";
import { VisibilitySelector, VisibilityBadge } from "./VisibilitySelector";
import { IngredientAdder } from "./IngredientAdder";
import type { Recipe, Category, RecipeVisibility } from "@/types";

interface RecipeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  editMode: boolean;
  isCreating?: boolean;
  isOwner?: boolean;
  // View mode props
  onStartEdit: () => void;
  onDelete: () => void;
  onImageUpload: () => void;
  uploadingImage: boolean;
  onOpenShareDialog?: () => void;
  // Edit mode props
  editName: string;
  setEditName: (value: string) => void;
  editCategory: Category;
  setEditCategory: (value: Category) => void;
  editServings: string;
  setEditServings: (value: string) => void;
  editPrepTime: string;
  setEditPrepTime: (value: string) => void;
  editCookTime: string;
  setEditCookTime: (value: string) => void;
  editInstructions: string;
  setEditInstructions: (value: string) => void;
  editIngredients: EditIngredient[];
  setEditIngredients: React.Dispatch<React.SetStateAction<EditIngredient[]>>;
  editVisibility: RecipeVisibility;
  setEditVisibility: (value: RecipeVisibility) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function RecipeDetailDialog({
  open,
  onOpenChange,
  recipe,
  editMode,
  isCreating = false,
  isOwner = false,
  onStartEdit,
  onDelete,
  onImageUpload,
  uploadingImage,
  onOpenShareDialog,
  editName,
  setEditName,
  editCategory,
  setEditCategory,
  editServings,
  setEditServings,
  editPrepTime,
  setEditPrepTime,
  editCookTime,
  setEditCookTime,
  editInstructions,
  setEditInstructions,
  editIngredients,
  setEditIngredients,
  editVisibility,
  setEditVisibility,
  onSave,
  onCancelEdit,
  isSaving,
}: RecipeDetailDialogProps) {
  const showForm = editMode || isCreating;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditIngredients((items) => {
        const oldIndex = items.findIndex((_, i) => `ing-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `ing-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    setEditIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const removeIngredient = (index: number) => {
    setEditIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) onCancelEdit();
    }}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Nouvelle recette" : (recipe?.name || "Recette")}</DialogTitle>
        </DialogHeader>

        {/* View Mode */}
        {recipe && !showForm && (
          <div className="space-y-4">
            <div className="flex flex-col-reverse gap-4 sm:flex-row">
              <div className="flex-1 flex flex-col gap-2 md:gap-3">
                <h2 className="text-lg md:text-xl font-bold">{recipe.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <CategoryBadge category={recipe.category} className="w-fit" />
                  <VisibilityBadge visibility={recipe.visibility} />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{recipe.base_servings} personnes</p>
                  {recipe.prep_time && <p>Préparation: {recipe.prep_time} min</p>}
                  {recipe.cook_time && <p>Cuisson: {recipe.cook_time} min</p>}
                </div>
              </div>
              {recipe.image_path && (
                <div className="w-full h-40 sm:w-40 sm:h-40 md:w-52 md:h-52 flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={recipe.image_path} alt={recipe.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Ingrédients</Label>
                <ul className="mt-2 space-y-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <IngredientLine
                      key={idx}
                      ingredientName={ing.ingredient_name}
                      quantity={ing.quantity}
                      unitDisplay={ing.unit_display}
                      quantityNormalized={ing.quantity_normalized}
                      unitNormalized={ing.unit_normalized}
                    />
                  ))}
                </ul>
              </div>
            )}

            {recipe.instructions && (
              <div>
                <Label className="text-muted-foreground">Instructions</Label>
                <p className="mt-2 text-sm whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            )}

            {isOwner && (
              <div className="flex flex-col gap-2 pt-4 border-t sm:flex-row sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={onImageUpload} disabled={uploadingImage} className="w-full sm:w-auto">
                    {uploadingImage ? (
                      <LoadingSpinner className="mr-2" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    {recipe.image_path ? "Changer l'image" : "Ajouter une image"}
                  </Button>
                  <Button variant="outline" onClick={onStartEdit} className="w-full sm:w-auto">
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  {recipe.visibility === "shared" && onOpenShareDialog && (
                    <Button variant="outline" onClick={onOpenShareDialog} className="w-full sm:w-auto">
                      <Users className="h-4 w-4 mr-2" />
                      Partages
                    </Button>
                  )}
                </div>
                <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Edit/Create Mode */}
        {showForm && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Nom</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom de la recette" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Categorie</Label>
                    <Select value={editCategory} onValueChange={(v) => setEditCategory(v as Category)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <VisibilitySelector
                    value={editVisibility}
                    onChange={setEditVisibility}
                  />
                </div>
                {editVisibility === "shared" && (
                  recipe && onOpenShareDialog ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onOpenShareDialog}
                      className="w-full"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Gérer les partages
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Créez d'abord la recette pour gérer les partages
                    </p>
                  )
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Personnes</Label>
                    <Input type="number" value={editServings} onChange={(e) => setEditServings(e.target.value)} />
                  </div>
                  <div>
                    <Label>Prépa (min)</Label>
                    <Input type="number" value={editPrepTime} onChange={(e) => setEditPrepTime(e.target.value)} />
                  </div>
                  <div>
                    <Label>Cuisson (min)</Label>
                    <Input type="number" value={editCookTime} onChange={(e) => setEditCookTime(e.target.value)} />
                  </div>
                </div>
              </div>
              {recipe?.image_path && (
                <div className="w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={recipe.image_path} alt={recipe.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground">Ingredients</Label>

              {/* Ingredient Adder */}
              <div className="mt-2">
                <IngredientAdder
                  onAdd={(newIng) => {
                    setEditIngredients((prev) => [...prev, newIng]);
                  }}
                />
              </div>

              {/* Existing Ingredients List */}
              {editIngredients.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={editIngredients.map((_, i) => `ing-${i}`)} strategy={verticalListSortingStrategy}>
                    <div className="mt-3 space-y-2">
                      {editIngredients.map((ing, idx) => (
                        <SortableIngredient
                          key={`ing-${idx}`}
                          id={`ing-${idx}`}
                          ing={ing}
                          index={idx}
                          updateIngredient={updateIngredient}
                          onRemove={removeIngredient}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                className="min-h-[150px]"
                placeholder="Instructions de préparation..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={onSave} disabled={isSaving || !editName.trim()}>
                {isSaving ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isCreating ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
