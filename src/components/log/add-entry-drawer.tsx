"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { FoodSearch } from "@/components/log/food-search";
import { QuantityStep } from "@/components/log/quantity-step";
import { QuickAddFoodForm } from "@/components/log/quick-add-food-form";
import { defaultMealTypeForNow } from "@/lib/meal-type";
import {
  useAddCustomFood,
  useAddEntry,
  useDeleteEntry,
  useRestoreEntry,
  useUpdateEntryQuantity,
} from "@/lib/data/queries";
import type { FoodItem, FoodLogEntry, MealType } from "@/types/nutrical";

type View = "search" | "quantity" | "quick-add";

interface AddEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  editingEntry?: FoodLogEntry | null;
  /** Bump this whenever a new add/edit session should start (e.g. each time the FAB or a row is tapped) so internal state resets without an effect. */
  sessionId: number;
}

export function AddEntryDrawer({
  open,
  onOpenChange,
  date,
  editingEntry,
  sessionId,
}: AddEntryDrawerProps) {
  const title = editingEntry ? "Edit entry" : "Add to log";

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title}>
      <AddEntryDrawerBody
        key={sessionId}
        date={date}
        editingEntry={editingEntry ?? null}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveModal>
  );
}

interface AddEntryDrawerBodyProps {
  date: string;
  editingEntry: FoodLogEntry | null;
  onClose: () => void;
}

function AddEntryDrawerBody({ date, editingEntry, onClose }: AddEntryDrawerBodyProps) {
  const isEditing = Boolean(editingEntry);

  const [view, setView] = useState<View>(isEditing ? "quantity" : "search");
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(() =>
    editingEntry ? foodFromEntry(editingEntry) : null,
  );
  const [quantity, setQuantity] = useState(editingEntry?.quantity ?? 1);
  const [mealType, setMealType] = useState<MealType>(
    editingEntry?.mealType ?? defaultMealTypeForNow(),
  );

  const addEntry = useAddEntry(date);
  const updateEntry = useUpdateEntryQuantity(date);
  const deleteEntryMutation = useDeleteEntry(date);
  const restoreEntry = useRestoreEntry(date);
  const addCustomFood = useAddCustomFood();

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food);
    setQuantity(1);
    setView("quantity");
  }

  function handleSubmit() {
    if (!selectedFood) return;

    if (isEditing && editingEntry) {
      updateEntry.mutate({ entryId: editingEntry.id, quantity });
      toast(`Updated ${selectedFood.name}`);
    } else {
      addEntry.mutate({ foodId: selectedFood.id, logDate: date, mealType, quantity });
      toast(`Added ${selectedFood.name}`);
    }
    onClose();
  }

  function handleDelete() {
    if (!editingEntry) return;
    const removed = editingEntry;
    deleteEntryMutation.mutate(removed.id);
    onClose();
    toast(`Removed ${removed.foodName}`, {
      action: {
        label: "Undo",
        onClick: () => restoreEntry.mutate(removed),
      },
    });
  }

  function handleQuickAddSubmit(food: Omit<FoodItem, "id" | "isCustom">) {
    addCustomFood.mutate(food, {
      onSuccess: (newFood) => {
        handleSelectFood(newFood);
      },
    });
  }

  return (
    <>
      {view === "search" && (
        <FoodSearch
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelectFood}
          onQuickAddRequested={() => setView("quick-add")}
        />
      )}

      {view === "quick-add" && (
        <QuickAddFoodForm
          initialName={query}
          onCancel={() => setView("search")}
          onSubmit={handleQuickAddSubmit}
        />
      )}

      {view === "quantity" && selectedFood && (
        <QuantityStep
          food={selectedFood}
          quantity={quantity}
          onQuantityChange={setQuantity}
          mealType={mealType}
          onMealTypeChange={setMealType}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onDelete={isEditing ? handleDelete : undefined}
          onBackToSearch={!isEditing ? () => setView("search") : undefined}
        />
      )}
    </>
  );
}

/**
 * Reconstructs a per-serving FoodItem from an existing log entry so editing
 * doesn't need to re-fetch the food record — the entry's own stored macros
 * (computed at write time) are the source of truth for what was actually logged.
 */
function foodFromEntry(entry: FoodLogEntry): FoodItem {
  const q = entry.quantity || 1;
  return {
    id: entry.foodId,
    name: entry.foodName,
    brand: null,
    category: "snack",
    servingSize: 1,
    servingUnit: "serving",
    servingLabel: "1 serving",
    calories: entry.calories / q,
    proteinG: entry.proteinG / q,
    carbsG: entry.carbsG / q,
    fatG: entry.fatG / q,
    fiberG: entry.fiberG != null ? entry.fiberG / q : null,
    sugarG: entry.sugarG != null ? entry.sugarG / q : null,
    sodiumMg: null,
  };
}
