"use client";

import { useLocale, useTranslations } from "next-intl";
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
import { getTranslatedName } from "@/lib/utils/translations";
import type { Recipe } from "@/types";
import type { Locale } from "@/i18n/routing";

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
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('planning.servingsCount')}</DialogTitle>
        </DialogHeader>
        {recipe && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {recipe.image_path && (
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={recipe.image_path}
                    alt={getTranslatedName(recipe.translations, recipe.name, locale)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium line-clamp-2">
                  {getTranslatedName(recipe.translations, recipe.name, locale)}
                </p>
                <CategoryBadge category={recipe.category} className="mt-1 text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('planning.howManyPersons')}</Label>
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
                {t('common.cancel')}
              </Button>
              <Button onClick={onConfirm}>
                {t('common.add')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
