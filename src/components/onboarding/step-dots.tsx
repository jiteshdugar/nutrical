import { cn } from "@/lib/utils";

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-6 bg-primary" : "w-1.5 bg-muted",
          )}
        />
      ))}
    </div>
  );
}
