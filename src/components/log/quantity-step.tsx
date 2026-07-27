"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FoodItem, MealType } from "@/types/nutrical";

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

interface QuantityStepProps {
  food: FoodItem;
  quantity: number;
  onQuantityChange: (q: number) => void;
  mealType: MealType;
  onMealTypeChange: (m: MealType) => void;
  isEditing: boolean;
  onSubmit: () => void;
  onDelete?: () => void;
  onBackToSearch?: () => void;
}

export function QuantityStep({
  food,
  quantity,
  onQuantityChange,
  mealType,
  onMealTypeChange,
  isEditing,
  onSubmit,
  onDelete,
  onBackToSearch,
}: QuantityStepProps) {
  function step(delta: number) {
    const next = Math.max(0.25, Math.round((quantity + delta) * 4) / 4);
    onQuantityChange(next);
  }

  return (
    <div className="flex flex-col gap-5 px-1 py-2">
      <div>
        <div className="font-medium">{food.name}</div>
        <div className="text-sm text-muted-foreground">
          {food.brand ? `${food.brand} · ` : ""}
          {food.servingLabel}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Meal</div>
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onMealTypeChange(opt.value)}
              className={cn(
                "rounded-lg border px-1 py-2 text-xs font-medium transition-colors",
                mealType === opt.value
                  ? "border-primary bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Quantity</div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => step(-0.5)}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <div className="flex-1 text-center text-lg font-semibold tabular-nums">
            {quantity} <span className="text-sm font-normal text-muted-foreground">servings</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => step(0.5)}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-muted/60 p-4">
        <div className="text-center text-2xl font-semibold tabular-nums">
          {Math.round(food.calories * quantity)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">cal</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">{round1(food.proteinG * quantity)}g</div>
            Protein
          </div>
          <div>
            <div className="font-medium text-foreground">{round1(food.carbsG * quantity)}g</div>
            Carbs
          </div>
          <div>
            <div className="font-medium text-foreground">{round1(food.fatG * quantity)}g</div>
            Fat
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {isEditing ? (
          <Button variant="outline" size="icon" onClick={onDelete} aria-label="Delete entry">
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" onClick={onBackToSearch}>
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={onSubmit}>
          {isEditing ? "Save changes" : "Add to log"}
        </Button>
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
