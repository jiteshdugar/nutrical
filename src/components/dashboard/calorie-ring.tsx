"use client";

import { cn } from "@/lib/utils";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

const SIZE = 220;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const remaining = target - consumed;
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = remaining < 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500 ease-out",
            isOver ? "stroke-destructive" : "stroke-primary",
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={cn("text-4xl font-semibold tabular-nums", isOver && "text-destructive")}>
          {Math.abs(Math.round(remaining))}
        </span>
        <span className="text-sm text-muted-foreground">
          {isOver ? "calories over" : "calories left"}
        </span>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>{Math.round(consumed)} eaten</span>
          <span>{target} goal</span>
        </div>
      </div>
    </div>
  );
}
