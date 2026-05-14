"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface DayData {
  date: string;
  total: number;
  published: number;
}

interface Props {
  data: DayData[];
  days: number;
}

function formatDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  if (days <= 14) {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }
  // Weekly grouping label — just show day/month
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

function aggregateByWeek(data: DayData[]): DayData[] {
  const weeks: Record<string, DayData> = {};
  for (const d of data) {
    const date = new Date(d.date + "T00:00:00");
    // ISO week start (Monday)
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { date: key, total: 0, published: 0 };
    weeks[key].total += d.total;
    weeks[key].published += d.published;
  }
  return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
}

export function ReviewsBarChart({ data, days }: Props) {
  const chartData = days > 14 ? aggregateByWeek(data) : data;

  const formatted = chartData.map((d) => ({
    ...d,
    label: formatDate(d.date, days),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / .07)",
          }}
          cursor={{ fill: "#f5f3ff" }}
          formatter={(value, name) => [
            value as number,
            name === "total" ? "Novos reviews" : "Publicados",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => (value === "total" ? "Novos reviews" : "Publicados")}
        />
        <Bar dataKey="total"     fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="published" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
