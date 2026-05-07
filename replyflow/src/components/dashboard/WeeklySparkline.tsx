"use client";

import {
  AreaChart, Area, XAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

interface DayPoint {
  label: string;
  total: number;
}

interface Props {
  data: DayPoint[];
  weekTotal: number;
  trend: number; // positive = up, negative = down, percentage vs prev week
}

function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) return <span className="text-xs text-gray-400">→ estável</span>;
  const up = trend > 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-green-600" : "text-rose-500"}`}>
      {up ? "↑" : "↓"} {Math.abs(trend)}% vs semana anterior
    </span>
  );
}

export function WeeklySparkline({ data, weekTotal, trend }: Props) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Últimos 7 dias</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{weekTotal}</p>
          <p className="text-xs text-gray-500">reviews recebidos</p>
        </div>
        <div className="text-right pt-1">
          <TrendBadge trend={trend} />
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={70}>
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 4px rgb(0 0 0 / .06)",
                padding: "4px 8px",
              }}
              cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
              formatter={(value) => [value as number, "Reviews"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#sparkGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "#6366f1" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[70px] flex items-center justify-center text-xs text-gray-300">
          Nenhum review esta semana
        </div>
      )}
    </div>
  );
}
