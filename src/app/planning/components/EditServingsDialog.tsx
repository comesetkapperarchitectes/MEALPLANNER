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
import type { MealPlan } from "@/types";

interface EditServingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealPlan | null;
  servings: string;
  onServingsChange: (value: string) => void;
  onConfirm: () => void;
}

export function EditServingsDialog({
  open,
  onOpenChange,
  meal,
  servings,
  onServingsChange,
  onConfirm,
}: EditServingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les portions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {meal && (
            <p className="text-muted-foreground">
              {meal.recipe?.name}
            </p>
          )}
          <div className="space-y-2">
            <Label>Nombre de personnes</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={servings}
              onChange={(e) => onServingsChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onConfirm}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
