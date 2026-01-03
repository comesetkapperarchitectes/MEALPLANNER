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
  return (
    <div className="md:hidden space-y-3">
      {/* Week navigation with arrows */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigateWeek(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-semibold">
            Du {formatDisplayDate(weekDates[0])} au {formatDisplayDate(weekDates[6])}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigateWeek(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day pills for quick selection */}
      <div className="flex justify-between gap-1">
        {days.map((day, index) => {
          const dateNum = new Date(weekDates[index]).getDate();
          return (
            <button
              key={day}
              onClick={() => onSelectDay(index)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex flex-col items-center",
                selectedDayIndex === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              <span>{day.slice(0, 3)}</span>
              <span className="text-[10px]">{dateNum}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
