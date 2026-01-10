"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronsUpDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getIngredients, createIngredient } from "@/lib/api/ingredients";
import { getDisplayableUnits } from "@/lib/api/units";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import type { Ingredient, IngredientCategory, Unit } from "@/types";
import type { EditIngredient } from "./SortableIngredient";

interface IngredientAdderProps {
  onAdd: (ingredient: EditIngredient) => void;
}

export function IngredientAdder({ onAdd }: IngredientAdderProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Combobox state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // New ingredient dialog state
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientCategory, setNewIngredientCategory] = useState<IngredientCategory>("epicerie");
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingredientsData, unitsData] = await Promise.all([
        getIngredients(),
        getDisplayableUnits(),
      ]);
      setIngredients(ingredientsData);
      setUnits(unitsData);
      // Default to 'g' unit
      const defaultUnit = unitsData.find((u) => u.code === 'g');
      if (defaultUnit) setSelectedUnit(defaultUnit);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient || !quantity || !selectedUnit) return;

    onAdd({
      ingredient_id: selectedIngredient.id,
      ingredient_name: selectedIngredient.name,
      quantity: quantity,
      unit_id: selectedUnit.id,
      unit: selectedUnit,
    });

    // Reset form
    setQuantity("");
    setSelectedIngredient(null);
    setSearchValue("");
    // Keep the selected unit for convenience
  };

  const handleCreateIngredient = async () => {
    if (!newIngredientName.trim()) return;

    setCreatingIngredient(true);
    try {
      const newId = await createIngredient({
        name: newIngredientName.trim(),
        category: newIngredientCategory,
        is_staple: false,
      });

      const newIngredient: Ingredient = {
        id: newId,
        name: newIngredientName.trim(),
        category: newIngredientCategory,
        is_staple: false,
      };

      setIngredients(prev => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIngredient(newIngredient);
      setShowNewIngredient(false);
      setNewIngredientName("");
      setNewIngredientCategory("epicerie");
    } catch (error) {
      console.error("Error creating ingredient:", error);
      alert("Erreur lors de la creation de l'ingredient");
    } finally {
      setCreatingIngredient(false);
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getUnitLabel = (unit: Unit) => {
    return unit.translations.fr?.abbr || unit.code;
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <Label className="text-sm font-medium">Ajouter un ingredient</Label>

      <div className="flex flex-wrap gap-2">
        {/* Quantity */}
        <Input
          type="number"
          placeholder="Qte"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-20"
        />

        {/* Unit select */}
        <Select
          value={selectedUnit?.id.toString() || ""}
          onValueChange={(v) => {
            const unit = units.find((u) => u.id === parseInt(v));
            setSelectedUnit(unit || null);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Unite" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id.toString()}>
                {getUnitLabel(unit)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ingredient search combobox */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {selectedIngredient
                ? selectedIngredient.name
                : "Chercher ingredient..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput
                placeholder="Rechercher..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {loading ? (
                  <div className="p-2 text-sm text-center text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredIngredients.length === 0 ? (
                  <CommandEmpty>
                    <div className="text-sm">Aucun ingredient trouve</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setNewIngredientName(searchValue);
                        setShowNewIngredient(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Creer "{searchValue}"
                    </Button>
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredIngredients.map((ing) => (
                      <CommandItem
                        key={ing.id}
                        value={ing.name}
                        onSelect={() => {
                          setSelectedIngredient(ing);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIngredient?.id === ing.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {ing.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Add button */}
        <Button
          type="button"
          size="icon"
          onClick={handleAddIngredient}
          disabled={!selectedIngredient || !quantity || !selectedUnit}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* New ingredient form */}
      {showNewIngredient && (
        <div className="p-3 border rounded-lg bg-background space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Nouvel ingredient</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowNewIngredient(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Input
            placeholder="Nom de l'ingredient"
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
          />

          <Select
            value={newIngredientCategory}
            onValueChange={(v) => setNewIngredientCategory(v as IngredientCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            onClick={handleCreateIngredient}
            disabled={!newIngredientName.trim() || creatingIngredient}
            className="w-full"
          >
            {creatingIngredient ? "Creation..." : "Creer l'ingredient"}
          </Button>
        </div>
      )}
    </div>
  );
}
