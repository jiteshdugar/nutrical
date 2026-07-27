"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodItem } from "@/types/nutrical";

interface QuickAddFoodFormProps {
  initialName: string;
  onCancel: () => void;
  onSubmit: (food: Omit<FoodItem, "id" | "isCustom">) => void;
}

export function QuickAddFoodForm({ initialName, onCancel, onSubmit }: QuickAddFoodFormProps) {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState<number | null>(null);
  const [proteinG, setProteinG] = useState<number | null>(null);
  const [carbsG, setCarbsG] = useState<number | null>(null);
  const [fatG, setFatG] = useState<number | null>(null);

  const canSubmit = name.trim().length > 0 && calories != null && calories >= 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      brand: null,
      category: "snack",
      servingSize: 1,
      servingUnit: "piece",
      servingLabel: "1 serving",
      calories: calories ?? 0,
      proteinG: proteinG ?? 0,
      carbsG: carbsG ?? 0,
      fatG: fatG ?? 0,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
    });
  }

  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Add a new food</h2>
        <p className="text-sm text-muted-foreground">
          Not in our list yet — add it yourself. It&rsquo;ll be saved for next time too.
        </p>
      </div>

      <div>
        <Label htmlFor="qa-name" className="mb-2 block">
          Food name
        </Label>
        <Input id="qa-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="qa-cal" className="mb-2 block">
          Calories (per serving)
        </Label>
        <Input
          id="qa-cal"
          type="number"
          inputMode="numeric"
          value={calories ?? ""}
          onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="qa-protein" className="mb-2 block">
            Protein (g)
          </Label>
          <Input
            id="qa-protein"
            type="number"
            inputMode="numeric"
            value={proteinG ?? ""}
            onChange={(e) => setProteinG(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <Label htmlFor="qa-carbs" className="mb-2 block">
            Carbs (g)
          </Label>
          <Input
            id="qa-carbs"
            type="number"
            inputMode="numeric"
            value={carbsG ?? ""}
            onChange={(e) => setCarbsG(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <Label htmlFor="qa-fat" className="mb-2 block">
            Fat (g)
          </Label>
          <Input
            id="qa-fat"
            type="number"
            inputMode="numeric"
            value={fatG ?? ""}
            onChange={(e) => setFatG(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Back to search
        </Button>
        <Button className="flex-1" disabled={!canSubmit} onClick={handleSubmit}>
          Add food
        </Button>
      </div>
    </div>
  );
}
