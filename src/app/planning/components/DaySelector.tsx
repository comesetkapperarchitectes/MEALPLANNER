"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  onNavigateWeek: (direction: number) => void;
  weekDates: string[];
  formatDisplayDate: (dateStr: string) => string;
  days: string[];
}

export function DaySelector({
  selectedDayIndex,
  onSelectDay,
  onNavigateWeek,
  weekDates,
  formatDisplayDate,
  days,
}: DaySelectorProps) {
  const navigateDay = (direction: number) => {
    const newIndex = selectedDayIndex + direction;
    if (newIndex < 0) {
      // Go to previous week, select Sunday
      onNavigateWeek(-1);
      onSelectDay(6);
    } else if (newIndex > 6) {
      // Go to next week, select Monday
      onNavigateWeek(1);
      onSelectDay(0);
    } else {
      onSelectDay(newIndex);
    }
  };

  return (
    <div className="md:hidden space-y-3">
      {/* Day navigation with arrows */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDay(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-semibold text-lg">{days[selectedDayIndex]}</div>
          <div className="text-sm text-muted-foreground">
            {formatDisplayDate(weekDates[selectedDayIndex])}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDay(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day pills for quick selection */}
      <div className="flex justify-between gap-1">
        {days.map((day, index) => (
          <button
            key={day}
            onClick={() => onSelectDay(index)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors",
              selectedDayIndex === index
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}
