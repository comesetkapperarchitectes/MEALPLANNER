"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jsonInput: string;
  onJsonInputChange: (value: string) => void;
  onImport: () => void;
  error: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  jsonInput,
  onJsonInputChange,
  onImport,
  error,
}: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onChange={(e) => onJsonInputChange(e.target.value)}
            placeholder='{"name": "Ma recette", "category": "plat", ...}'
            className="min-h-[300px] font-mono text-sm"
          />
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onImport} disabled={!jsonInput.trim()}>
              Importer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
