"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function BenchmarkChart({ data, unit }: { data: Array<{ date: string; value: number }>; unit: string }) {
  return <div className="mt-3 h-40 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} /><Tooltip formatter={(value) => [`${value} ${unit}`, "Value"]} /><Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>;
}
