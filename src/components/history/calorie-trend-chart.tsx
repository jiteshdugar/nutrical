"use client";

import { format, parseISO } from "date-fns";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DaySummary } from "@/lib/data/repository";

interface CalorieTrendChartProps {
  summaries: DaySummary[];
  dateFormat: string;
}

export function CalorieTrendChart({ summaries, dateFormat }: CalorieTrendChartProps) {
  const data = summaries.map((s) => ({
    label: format(parseISO(s.date), dateFormat),
    calories: Math.round(s.calories),
    target: s.calorieTarget || undefined,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
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
            width={44}
            tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : `${value}`)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="calories" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            dataKey="target"
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
