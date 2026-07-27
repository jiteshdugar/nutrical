import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  colorClassName: string;
}

export function MacroBar({ label, consumed, target, colorClassName }: MacroBarProps) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <div className="flex-1">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(consumed)}/{Math.round(target)}g
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClassName)}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
