"use client";

import { useTranslations } from "next-intl";
import { Lock, Globe, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { RecipeVisibility } from "@/types";

const VISIBILITY_ICONS: Record<RecipeVisibility, React.ReactNode> = {
  private: <Lock className="h-4 w-4" />,
  public: <Globe className="h-4 w-4" />,
  shared: <Users className="h-4 w-4" />,
};

interface VisibilitySelectorProps {
  value: RecipeVisibility;
  onChange: (value: RecipeVisibility) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function VisibilitySelector({
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: VisibilitySelectorProps) {
  const t = useTranslations();
  const visibilityOptions: RecipeVisibility[] = ["private", "public", "shared"];

  return (
    <div className="space-y-2">
      {showLabel && <Label>{t('recipes.visibility')}</Label>}
      <Select
        value={value}
        onValueChange={(v) => onChange(v as RecipeVisibility)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {VISIBILITY_ICONS[value]}
              <span>{t(`recipes.visibility_${value}`)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {visibilityOptions.map((option) => (
            <SelectItem key={option} value={option}>
              <div className="flex items-center gap-2">
                {VISIBILITY_ICONS[option]}
                <div className="flex flex-col">
                  <span>{t(`recipes.visibility_${option}`)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`recipes.visibility_${option}_desc`)}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Badge version for view mode
interface VisibilityBadgeProps {
  visibility: RecipeVisibility;
  className?: string;
}

export function VisibilityBadge({ visibility, className = "" }: VisibilityBadgeProps) {
  const t = useTranslations();

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground ${className}`}
    >
      {VISIBILITY_ICONS[visibility]}
      <span>{t(`recipes.visibility_${visibility}`)}</span>
    </div>
  );
}
