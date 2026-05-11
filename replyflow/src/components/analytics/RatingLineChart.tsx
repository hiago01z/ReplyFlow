"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RatingPoint {
  date: string;
  avgRating: number;
  count: number;
}

interface RatingLineChartProps {
  data: RatingPoint[];
  days: number;
  overallAvg: number;
}

function formatDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (days <= 14) {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface TooltipPayload {
  value: number;
  payload: RatingPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
  days,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  days: number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const d = new Date((label ?? "") + "T00:00:00");
  const dateLabel = days <= 14
    ? d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    : `Semana de ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{dateLabel}</p>
      {point.count > 0 ? (
        <>
          <p className="text-amber-600 font-bold text-sm">
            {"★".repeat(Math.round(point.avgRating))} {point.avgRating.toFixed(1)}
          </p>
          <p className="text-gray-500 mt-0.5">{point.count} review{point.count !== 1 ? "s" : ""}</p>
        </>
      ) : (
        <p className="text-gray-400 italic">Sem reviews</p>
      )}
    </div>
  );
}

export function RatingLineChart({ data, days, overallAvg }: RatingLineChartProps) {
  // Filter out leading/trailing zero-count entries for cleaner chart
  const hasData = data.some((d) => d.count > 0);

  // Prepare display data: replace 0-count points with null for gap rendering
  const chartData = data.map((d) => ({
    ...d,
    displayRating: d.count > 0 ? d.avgRating : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f0f0" vertical={false} />

        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v, days)}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />

        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}★`}
        />

        {/* Overall average reference line */}
        {hasData && overallAvg > 0 && (
          <ReferenceLine
            y={overallAvg}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
            label={{ value: `Média: ${overallAvg.toFixed(1)}★`, position: "insideTopRight", fontSize: 9, fill: "#9ca3af" }}
          />
        )}

        <Tooltip content={<CustomTooltip days={days} />} />

        <Area
          type="monotone"
          dataKey="displayRating"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#ratingGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
