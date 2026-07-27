"use client";

import { format, parseISO } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DaySummary } from "@/lib/data/repository";

interface MacroTrendChartProps {
  summaries: DaySummary[];
  dateFormat: string;
}

export function MacroTrendChart({ summaries, dateFormat }: MacroTrendChartProps) {
  const data = summaries.map((s) => ({
    label: format(parseISO(s.date), dateFormat),
    Protein: Math.round(s.proteinG),
    Carbs: Math.round(s.carbsG),
    Fat: Math.round(s.fatG),
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="Protein" stackId="macros" fill="var(--chart-2)" radius={[0, 0, 0, 0]} maxBarSize={24} />
          <Bar dataKey="Carbs" stackId="macros" fill="var(--chart-3)" maxBarSize={24} />
          <Bar dataKey="Fat" stackId="macros" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
