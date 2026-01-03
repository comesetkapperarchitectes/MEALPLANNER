"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Trash2, Upload, Eye, ImagePlus, Pencil, Save, X, GripVertical } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as api from "@/lib/api";
import { RECIPE_CATEGORIES, SEASONS } from "@/lib/constants";
import type { Recipe, Category, Season, RecipeImport } from "@/types";

interface SortableIngredientProps {
  id: string;
  ing: { ingredient_id: number; ingredient_name: string; quantity: string; unit_display: string; quantity_normalized: string; unit_normalized: string };
  index: number;
  updateIngredient: (index: number, field: string, value: string) => void;
}

function SortableIngredient({ id, ing, index, updateIngredient }: SortableIngredientProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 text-sm bg-background">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        className="w-20"
        value={ing.quantity}
        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
      />
      <Input
        className="w-24"
        value={ing.unit_display}
        onChange={(e) => updateIngredient(index, "unit_display", e.target.value)}
      />
      <span className="flex-1">{ing.ingredient_name}</span>
      <Input
        className="w-20"
        value={ing.quantity_normalized}
        onChange={(e) => updateIngredient(index, "quantity_normalized", e.target.value)}
        placeholder="norm."
      />
      <Select
        value={ing.unit_normalized}
        onValueChange={(v) => updateIngredient(index, "unit_normalized", v)}
      >
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="g">g</SelectItem>
          <SelectItem value="ml">ml</SelectItem>
          <SelectItem value="piece">pièce</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importError, setImportError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadRecipeId, setPendingUploadRecipeId] = useState<number | null>(null);

  // Mode édition
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("plat");
  const [editServings, setEditServings] = useState("");
  const [editPrepTime, setEditPrepTime] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editIngredients, setEditIngredients] = useState<{ ingredient_id: number; ingredient_name: string; quantity: string; unit_display: string; quantity_normalized: string; unit_normalized: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecipes({
        search: search || undefined,
        category: categoryFilter !== "all" ? (categoryFilter as Category) : undefined,
        season: seasonFilter !== "all" ? (seasonFilter as Season) : undefined,
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
  }, [search, categoryFilter, seasonFilter]);

  const handleImport = async () => {
    setImportError("");
    try {
      const parsed = JSON.parse(jsonInput);
      // Support multiple formats: { recipes: [...] }, [...], or single object
      let recipesToImport: RecipeImport[];
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        recipesToImport = parsed.recipes;
      } else if (Array.isArray(parsed)) {
        recipesToImport = parsed;
      } else {
        recipesToImport = [parsed];
      }
      await api.importRecipes(recipesToImport);
      setJsonInput("");
      setImportDialogOpen(false);
      await loadRecipes();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Erreur d'import");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette recette ?")) return;
    try {
      await api.deleteRecipe(id);
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
      // Refresh selected recipe if viewing details
      if (selectedRecipe?.id === pendingUploadRecipeId) {
        const updated = await api.getRecipe(pendingUploadRecipeId);
        if (updated) setSelectedRecipe(updated);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImageId(null);
      setPendingUploadRecipeId(null);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const viewRecipeDetails = async (id: number) => {
    try {
      const recipe = await api.getRecipe(id);
      if (recipe) {
        setSelectedRecipe(recipe);
        setEditMode(false);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading recipe:", error);
    }
  };

  const startEditMode = () => {
    if (!selectedRecipe) return;
    setEditName(selectedRecipe.name);
    setEditCategory(selectedRecipe.category);
    setEditServings(selectedRecipe.base_servings.toString());
    setEditPrepTime(selectedRecipe.prep_time?.toString() || "");
    setEditCookTime(selectedRecipe.cook_time?.toString() || "");
    setEditInstructions(selectedRecipe.instructions || "");
    setEditIngredients(
      (selectedRecipe.ingredients || []).map((ing) => ({
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity.toString(),
        unit_display: ing.unit_display,
        quantity_normalized: ing.quantity_normalized.toString(),
        unit_normalized: ing.unit_normalized,
      }))
    );
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    try {
      await api.updateRecipe(selectedRecipe.id, {
        name: editName,
        category: editCategory,
        base_servings: parseInt(editServings) || 4,
        prep_time: editPrepTime ? parseInt(editPrepTime) : null,
        cook_time: editCookTime ? parseInt(editCookTime) : null,
        instructions: editInstructions || null,
        ingredients: editIngredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          quantity: parseFloat(ing.quantity) || 0,
          unit_display: ing.unit_display,
          quantity_normalized: parseFloat(ing.quantity_normalized) || 0,
          unit_normalized: ing.unit_normalized as "g" | "ml" | "piece",
        })),
      });
      // Refresh recipe
      const updated = await api.getRecipe(selectedRecipe.id);
      if (updated) setSelectedRecipe(updated);
      setEditMode(false);
      await loadRecipes();
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    setEditIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

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

  const getCategoryLabel = (cat: Category) => {
    return RECIPE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  };

  const getSeasonLabel = (season: Season) => {
    return SEASONS.find((s) => s.value === season)?.label || season;
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recettes</h1>
        <Button onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer JSON
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Saison" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes saisons</SelectItem>
            {SEASONS.map((season) => (
              <SelectItem key={season.value} value={season.value}>
                {season.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune recette trouvée</p>
            <Button className="mt-4" onClick={() => setImportDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Importer des recettes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => viewRecipeDetails(recipe.id)}
            >
              <div className="flex h-44">
                {/* Contenu à gauche */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 p-4">
                  <h3 className="font-semibold text-lg line-clamp-2">{recipe.name}</h3>
                  <Badge className="w-fit">{getCategoryLabel(recipe.category)}</Badge>
                  {(recipe.prep_time || recipe.cook_time) && (
                    <p className="text-sm text-muted-foreground">
                      {recipe.prep_time && `Prépa: ${recipe.prep_time}min`}
                      {recipe.prep_time && recipe.cook_time && " • "}
                      {recipe.cook_time && `Cuisson: ${recipe.cook_time}min`}
                    </p>
                  )}
                </div>
                {/* Image carrée à droite */}
                {recipe.image_path && (
                  <div className="w-44 h-44 flex-shrink-0">
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer des recettes</DialogTitle>
            <DialogDescription>
              Collez le JSON d&apos;une ou plusieurs recettes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"name": "Ma recette", "category": "plat", ...}'
              className="min-h-[300px] font-mono text-sm"
            />
            {importError && (
              <p className="text-destructive text-sm">{importError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleImport} disabled={!jsonInput.trim()}>
                Importer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) setEditMode(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedRecipe?.name || "Recette"}</DialogTitle>
          </DialogHeader>
          {selectedRecipe && !editMode && (
            <div className="space-y-4">
              {/* En-tête avec infos à gauche et image à droite */}
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-3">
                  <h2 className="text-xl font-bold">{selectedRecipe.name}</h2>
                  <Badge className="w-fit">{getCategoryLabel(selectedRecipe.category)}</Badge>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{selectedRecipe.base_servings} personnes</p>
                    {selectedRecipe.prep_time && <p>Préparation: {selectedRecipe.prep_time} min</p>}
                    {selectedRecipe.cook_time && <p>Cuisson: {selectedRecipe.cook_time} min</p>}
                  </div>
                </div>
                {selectedRecipe.image_path && (
                  <div className="w-52 h-52 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={selectedRecipe.image_path}
                      alt={selectedRecipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Ingrédients</Label>
                  <ul className="mt-2 space-y-1">
                    {selectedRecipe.ingredients.map((ing, idx) => {
                      const rawUnit = ing.unit_display || ing.unit_normalized || '';
                      const displayUnit = ['pièce', 'pièces', 'piece'].includes(rawUnit.toLowerCase()) ? '' : rawUnit;
                      const showNormalized = ing.unit_normalized !== 'piece' &&
                        (displayUnit !== ing.unit_normalized && displayUnit !== '');
                      return (
                        <li key={idx} className="text-sm flex items-center justify-between">
                          <span>• {ing.quantity} {displayUnit} {ing.ingredient_name}</span>
                          {showNormalized && (
                            <span className="text-xs text-muted-foreground">
                              {ing.quantity_normalized}{ing.unit_normalized}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {selectedRecipe.instructions && (
                <div>
                  <Label className="text-muted-foreground">Instructions</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {selectedRecipe.instructions}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleImageButtonClick(selectedRecipe.id)}
                    disabled={uploadingImageId === selectedRecipe.id}
                  >
                    {uploadingImageId === selectedRecipe.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    {selectedRecipe.image_path ? "Changer l'image" : "Ajouter une image"}
                  </Button>
                  <Button variant="outline" onClick={startEditMode}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedRecipe.id);
                    setDetailDialogOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}

          {/* Mode édition */}
          {selectedRecipe && editMode && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>Nom</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Catégorie</Label>
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
                {selectedRecipe.image_path && (
                  <div className="w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={selectedRecipe.image_path}
                      alt={selectedRecipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {editIngredients.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Ingrédients</Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={editIngredients.map((_, i) => `ing-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="mt-2 space-y-2">
                        {editIngredients.map((ing, idx) => (
                          <SortableIngredient
                            key={`ing-${idx}`}
                            id={`ing-${idx}`}
                            ing={ing}
                            index={idx}
                            updateIngredient={updateIngredient}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              {/* Actions édition */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
