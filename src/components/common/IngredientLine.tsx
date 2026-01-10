"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatUnit, getArticle } from "@/lib/utils/unitUtils";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Unit, Translations } from "@/types";
import type { Locale } from "@/i18n/routing";

interface IngredientLineProps {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit?: Unit;
  className?: string;
  translations?: Translations | null;
}

export function IngredientLine({
  ingredientId,
  ingredientName,
  quantity,
  unit,
  className,
  translations,
}: IngredientLineProps) {
  const locale = useLocale() as Locale;
  const displayName = getTranslatedName(translations, ingredientName, locale);
  const unitStr = formatUnit(unit, quantity, locale);
  const article = getArticle(unit, displayName, locale);

  return (
    <li className={className ?? "text-sm flex items-center justify-between"}>
      <span>
        {unitStr ? `• ${quantity} ${unitStr} ${article}` : "• "}
        <Link
          href={`/recettes?ingredient=${ingredientId}`}
          className="hover:underline hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {unitStr ? displayName : `${quantity} ${displayName}`}
        </Link>
      </span>
    </li>
  );
}
