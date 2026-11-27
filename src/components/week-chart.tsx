"use client";

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

export type WeekChartPoint = {
  label: string;
  sessions: number;
  target: number;
};

export function WeekChart({ data }: { data: WeekChartPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.sessions, 0);

  return (
    <div
      className="h-52 w-full"
      role="img"
      aria-label={`Sessions per week for the last ${data.length} weeks, ${total} sessions in total, compared with the weekly target.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: -22 }}
        >
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip
            cursor={{ fill: "rgba(184, 242, 74, 0.06)" }}
            contentStyle={{
              background: "var(--panel-raised)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              color: "var(--ink)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted)", marginBottom: 4 }}
          />
          <Bar
            dataKey="sessions"
            name="Sessions"
            fill="var(--accent)"
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
          <Line
            type="stepAfter"
            dataKey="target"
            name="Target"
            stroke="var(--muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
