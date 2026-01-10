"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DAY_KEYS } from "@/lib/constants";

interface DaySelectorProps {
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  onNavigateWeek: (direction: number) => void;
  weekDates: string[];
  formatDisplayDate: (dateStr: string) => string;
  dayKeys: typeof DAY_KEYS;
}

export function DaySelector({
  selectedDayIndex,
  onSelectDay,
  onNavigateWeek,
  weekDates,
  formatDisplayDate,
  dayKeys,
}: DaySelectorProps) {
  const t = useTranslations();

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
            {t('shopping.weekRange', { start: formatDisplayDate(weekDates[0]), end: formatDisplayDate(weekDates[6]) })}
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
        {dayKeys.map((dayKey, index) => {
          const dateNum = new Date(weekDates[index]).getDate();
          const abbrKey = `days.${dayKey.slice(0, 3)}` as const;
          return (
            <button
              key={dayKey}
              onClick={() => onSelectDay(index)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex flex-col items-center",
                selectedDayIndex === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              <span>{t(abbrKey)}</span>
              <span className="text-[10px]">{dateNum}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
