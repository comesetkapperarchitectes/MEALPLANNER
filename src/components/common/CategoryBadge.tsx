"use client";

import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Category } from "@/types";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] || category;
  return <Badge className={className}>{label}</Badge>;
}
