"use client";

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EditIngredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: string;
  unit_display: string;
  quantity_normalized: string;
  unit_normalized: string;
}

interface SortableIngredientProps {
  id: string;
  ing: EditIngredient;
  index: number;
  updateIngredient: (index: number, field: string, value: string) => void;
}

export function SortableIngredient({ id, ing, index, updateIngredient }: SortableIngredientProps) {
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
