"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRecentFoods, useSearchFoods } from "@/lib/data/queries";
import type { FoodItem } from "@/types/nutrical";

interface FoodSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (food: FoodItem) => void;
  onQuickAddRequested: (name: string) => void;
}

export function FoodSearch({ query, onQueryChange, onSelect, onQuickAddRequested }: FoodSearchProps) {
  const { data: recentFoods = [] } = useRecentFoods();
  const { data: results = [] } = useSearchFoods(query);

  const showRecent = query.trim().length === 0 && recentFoods.length > 0;
  const hasResults = results.length > 0;

  return (
    <Command shouldFilter={false} className="h-full">
      <CommandInput
        placeholder="Search foods…"
        value={query}
        onValueChange={onQueryChange}
        autoFocus
      />
      <CommandList className="max-h-none">
        {!hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                className="text-sm text-primary underline underline-offset-4"
                onClick={() => onQuickAddRequested(query)}
              >
                Add &ldquo;{query}&rdquo; as a new food
              </button>
            </div>
          </CommandEmpty>
        )}

        {showRecent && (
          <CommandGroup heading="Recent">
            {recentFoods.map((food) => (
              <CommandItem key={food.id} value={food.id} onSelect={() => onSelect(food)}>
                <FoodRow food={food} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && (
          <CommandGroup heading={showRecent ? "All foods" : undefined}>
            {results.map((food) => (
              <CommandItem key={food.id} value={food.id} onSelect={() => onSelect(food)}>
                <FoodRow food={food} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

function FoodRow({ food }: { food: FoodItem }) {
  return (
    <div className="flex w-full items-center justify-between gap-2 py-0.5">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{food.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {food.brand ? `${food.brand} · ` : ""}
          {food.servingLabel}
        </div>
      </div>
      <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {Math.round(food.calories)} cal
      </div>
    </div>
  );
}
