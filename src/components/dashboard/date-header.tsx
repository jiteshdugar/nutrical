"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { todayIsoDate } from "@/lib/data/repository";

interface DateHeaderProps {
  date: string; // ISO date
  onChange: (date: string) => void;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayIsoDate(d);
}

function formatDisplayDate(iso: string): string {
  const today = todayIsoDate();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  if (iso === tomorrow) return "Tomorrow";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DateHeader({ date, onChange }: DateHeaderProps) {
  const isToday = date === todayIsoDate();

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label="Previous day"
        onClick={() => onChange(addDays(date, -1))}
      >
        <ChevronLeft className="size-5" />
      </Button>

      <div className="flex flex-col items-center">
        <span className="text-base font-semibold">{formatDisplayDate(date)}</span>
        {!isToday && (
          <button
            className="text-xs text-primary underline underline-offset-4"
            onClick={() => onChange(todayIsoDate())}
          >
            Jump to today
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label="Next day"
        onClick={() => onChange(addDays(date, 1))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
