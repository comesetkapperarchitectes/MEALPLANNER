"use client";

import { useState, useEffect } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayableUnits } from "@/lib/api/units";
import type { Unit } from "@/types";

export interface EditIngredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: string;
  unit_id: number;
  unit?: Unit;
}

interface SortableIngredientProps {
  id: string;
  ing: EditIngredient;
  index: number;
  units: Unit[];
  updateIngredient: (index: number, field: string, value: string | number) => void;
  onRemove?: (index: number) => void;
}

export function SortableIngredient({ id, ing, index, units, updateIngredient, onRemove }: SortableIngredientProps) {
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

  const getUnitLabel = (unit: Unit) => {
    return unit.translations.fr?.abbr || unit.code;
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
      <Select
        value={ing.unit_id?.toString() || ""}
        onValueChange={(v) => updateIngredient(index, "unit_id", parseInt(v))}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id.toString()}>
              {getUnitLabel(unit)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex-1 min-w-0 truncate">{ing.ingredient_name}</span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
