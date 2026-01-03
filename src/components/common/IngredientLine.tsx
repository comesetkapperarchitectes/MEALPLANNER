"use client";

import { formatUnitDisplay } from "@/lib/utils/unitUtils";

interface IngredientLineProps {
  ingredientName: string;
  quantity: number;
  unitDisplay: string;
  quantityNormalized: number;
  unitNormalized: string;
  className?: string;
}

export function IngredientLine({
  ingredientName,
  quantity,
  unitDisplay,
  quantityNormalized,
  unitNormalized,
  className,
}: IngredientLineProps) {
  const { displayUnit, showNormalized } = formatUnitDisplay(
    unitDisplay || unitNormalized || "",
    unitNormalized
  );

  return (
    <li className={className ?? "text-sm flex items-center justify-between"}>
      <span>
        • {quantity} {displayUnit} {ingredientName}
      </span>
      {showNormalized && (
        <span className="text-xs text-muted-foreground">
          {quantityNormalized}
          {unitNormalized}
        </span>
      )}
    </li>
  );
}
