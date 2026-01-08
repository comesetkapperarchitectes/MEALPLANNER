"use client";

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

const VISIBILITY_OPTIONS: {
  value: RecipeVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "private",
    label: "Privee",
    description: "Seulement vous",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "public",
    label: "Publique",
    description: "Tout le monde",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    value: "shared",
    label: "Partagee",
    description: "Utilisateurs choisis",
    icon: <Users className="h-4 w-4" />,
  },
];

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
  const selectedOption = VISIBILITY_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="space-y-2">
      {showLabel && <Label>Visibilite</Label>}
      <Select
        value={value}
        onValueChange={(v) => onChange(v as RecipeVisibility)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center gap-2">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
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
  const option = VISIBILITY_OPTIONS.find((opt) => opt.value === visibility);
  if (!option) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground ${className}`}
    >
      {option.icon}
      <span>{option.label}</span>
    </div>
  );
}
