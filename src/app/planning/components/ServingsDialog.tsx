"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/common";
import type { Recipe } from "@/types";

interface ServingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  servings: string;
  onServingsChange: (value: string) => void;
  onConfirm: () => void;
}

export function ServingsDialog({
  open,
  onOpenChange,
  recipe,
  servings,
  onServingsChange,
  onConfirm,
}: ServingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nombre de portions</DialogTitle>
        </DialogHeader>
        {recipe && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {recipe.image_path && (
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={recipe.image_path}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium line-clamp-2">{recipe.name}</p>
                <CategoryBadge category={recipe.category} className="mt-1 text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pour combien de personnes ?</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={servings}
                onChange={(e) => onServingsChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={onConfirm}>
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
