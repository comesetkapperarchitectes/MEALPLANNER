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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onNavigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium min-w-[200px] text-center">
        Semaine du {formatDisplayDate(formatDate(weekStart))}
      </span>
      <Button variant="outline" size="icon" onClick={() => onNavigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
