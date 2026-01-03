"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeekNavigatorProps {
  weekStart: Date;
  onNavigate: (direction: number) => void;
  formatDisplayDate: (dateStr: string) => string;
  formatDate: (date: Date) => string;
}

export function WeekNavigator({
  weekStart,
  onNavigate,
  formatDisplayDate,
  formatDate,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => onNavigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-sm md:text-base min-w-[120px] md:min-w-[200px] text-center">
        <span className="hidden md:inline">Semaine du </span>
        {formatDisplayDate(formatDate(weekStart))}
      </span>
      <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => onNavigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
