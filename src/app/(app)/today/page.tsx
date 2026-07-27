"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DateHeader } from "@/components/dashboard/date-header";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroBar } from "@/components/dashboard/macro-bar";
import { MealSection } from "@/components/dashboard/meal-section";
import { AddEntryDrawer } from "@/components/log/add-entry-drawer";
import { todayIsoDate } from "@/lib/data/repository";
import { useDeleteEntry, useEntriesForDate, useGoalsForDate, useRestoreEntry } from "@/lib/data/queries";
import type { FoodLogEntry, MealType } from "@/types/nutrical";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function TodayPage() {
  const [date, setDate] = useState(todayIsoDate());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [drawerSessionId, setDrawerSessionId] = useState(0);

  const { data: goals } = useGoalsForDate(date);
  const { data: entries = [] } = useEntriesForDate(date);
  const deleteEntry = useDeleteEntry(date);
  const restoreEntry = useRestoreEntry(date);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          proteinG: acc.proteinG + e.proteinG,
          carbsG: acc.carbsG + e.carbsG,
          fatG: acc.fatG + e.fatG,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      ),
    [entries],
  );

  const entriesByMeal = useMemo(() => {
    const map: Record<MealType, FoodLogEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const entry of entries) map[entry.mealType].push(entry);
    return map;
  }, [entries]);

  function handleDelete(entry: FoodLogEntry) {
    deleteEntry.mutate(entry.id);
    toast(`Removed ${entry.foodName}`, {
      action: { label: "Undo", onClick: () => restoreEntry.mutate(entry) },
    });
  }

  function openAddDrawer() {
    setEditingEntry(null);
    setDrawerSessionId((id) => id + 1);
    setDrawerOpen(true);
  }

  function openEditDrawer(entry: FoodLogEntry) {
    setEditingEntry(entry);
    setDrawerSessionId((id) => id + 1);
    setDrawerOpen(true);
  }

  const hasEntries = entries.length > 0;

  return (
    <div className="relative flex flex-col gap-6 pb-20">
      <DateHeader date={date} onChange={setDate} />

      <div className="flex flex-col items-center gap-6 rounded-3xl border bg-card p-6">
        <CalorieRing consumed={totals.calories} target={goals?.calorieTarget ?? 2000} />
        <div className="flex w-full gap-4">
          <MacroBar
            label="Protein"
            consumed={totals.proteinG}
            target={goals?.proteinGTarget ?? 0}
            colorClassName="bg-chart-2"
          />
          <MacroBar
            label="Carbs"
            consumed={totals.carbsG}
            target={goals?.carbsGTarget ?? 0}
            colorClassName="bg-chart-3"
          />
          <MacroBar
            label="Fat"
            consumed={totals.fatG}
            target={goals?.fatGTarget ?? 0}
            colorClassName="bg-chart-4"
          />
        </div>
      </div>

      {!hasEntries && (
        <p className="text-center text-sm text-muted-foreground">
          Nothing logged yet — tap the + button to add your first meal.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {MEAL_ORDER.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            entries={entriesByMeal[mealType]}
            onSelectEntry={openEditDrawer}
            onDeleteEntry={handleDelete}
          />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <button
            type="button"
            aria-label="Add entry"
            onClick={openAddDrawer}
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
      </div>

      <AddEntryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        date={date}
        editingEntry={editingEntry}
        sessionId={drawerSessionId}
      />
    </div>
  );
}
