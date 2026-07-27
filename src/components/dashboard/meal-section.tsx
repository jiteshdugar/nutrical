"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodLogEntry, MealType } from "@/types/nutrical";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

interface MealSectionProps {
  mealType: MealType;
  entries: FoodLogEntry[];
  onSelectEntry: (entry: FoodLogEntry) => void;
  onDeleteEntry: (entry: FoodLogEntry) => void;
}

export function MealSection({ mealType, entries, onSelectEntry, onDeleteEntry }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const calories = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="rounded-2xl border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{MEAL_LABELS[mealType]}</span>
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground">{Math.round(calories)} cal</span>
          )}
        </div>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="border-t px-2 pb-2">
          {entries.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul>
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="group flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 hover:bg-muted/60"
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => onSelectEntry(entry)}
                  >
                    <div className="text-sm font-medium">{entry.foodName}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.quantity} serving{entry.quantity === 1 ? "" : "s"} ·{" "}
                      {Math.round(entry.calories)} cal
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.foodName}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={() => onDeleteEntry(entry)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
