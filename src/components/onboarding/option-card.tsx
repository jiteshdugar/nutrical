"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

interface OptionCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

export function OptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-accent"
          : "border-border hover:bg-muted/60",
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </div>
      ) : null}
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div
        className={cn(
          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected ? <Check className="size-3.5" /> : null}
      </div>
    </button>
  );
}
