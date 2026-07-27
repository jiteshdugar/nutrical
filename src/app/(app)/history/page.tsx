"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalorieTrendChart } from "@/components/history/calorie-trend-chart";
import { MacroTrendChart } from "@/components/history/macro-trend-chart";
import { useHistorySummary } from "@/lib/data/queries";
import { computeStreak } from "@/lib/data/repository";

const RANGES = [
  { value: "7", label: "7 days", dateFormat: "EEE" },
  { value: "30", label: "30 days", dateFormat: "M/d" },
] as const;

export default function HistoryPage() {
  const [range, setRange] = useState<"7" | "30">("7");
  const days = Number(range);
  const { data: summaries = [], isLoading } = useHistorySummary(days);

  const streak = computeStreak(summaries);
  const loggedDays = summaries.filter((s) => s.hasEntries).length;
  const dateFormat = RANGES.find((r) => r.value === range)?.dateFormat ?? "EEE";

  const hasAnyData = summaries.some((s) => s.hasEntries);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30")}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
          <Flame className="size-5" />
        </div>
        <div>
          <div className="font-medium">
            {streak > 0 ? `${streak} day streak` : "No streak yet"}
          </div>
          <div className="text-sm text-muted-foreground">
            Logged {loggedDays} of the last {days} days
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : !hasAnyData ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No logs yet for this period — trends will show up once you start logging meals.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Calories vs. target
            </h2>
            <CalorieTrendChart summaries={summaries} dateFormat={dateFormat} />
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Macros</h2>
            <MacroTrendChart summaries={summaries} dateFormat={dateFormat} />
          </div>
        </>
      )}
    </div>
  );
}
