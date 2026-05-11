"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Star, MessageSquare, Clock, BarChart2, RefreshCw } from "lucide-react";
import { ReviewsBarChart } from "./ReviewsBarChart";
import { RatingBarChart } from "./RatingBarChart";
import { RatingLineChart } from "./RatingLineChart";
import { cn } from "@/lib/utils";

interface DayData       { date: string; total: number; published: number }
interface RatingData    { stars: number; count: number; label: string }
interface StatusData    { status: string; count: number; label: string }
interface LocationData  { id: string; name: string; total: number; published: number }
interface RatingPoint   { date: string; avgRating: number; count: number }

interface AnalyticsData {
  reviewsPerDay:   DayData[];
  ratingBreakdown: RatingData[];
  statusBreakdown: StatusData[];
  topLocations:    LocationData[];
  ratingEvolution: RatingPoint[];
  totals: {
    total:     number;
    published: number;
    pending:   number;
    avgRating: number;
    replyRate: number;
  };
  locations: { id: string; name: string }[];
}

const PERIOD_OPTIONS = [
  { label: "7 dias",  value: 7  },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-500",
  pending:   "bg-amber-500",
  draft:     "bg-blue-400",
  approved:  "bg-teal-500",
  ignored:   "bg-gray-300",
};

export function AnalyticsDashboard() {
  const [days,       setDays]       = useState(30);
  const [locationId, setLocationId] = useState("");
  const [data, setData]             = useState<AnalyticsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchData = useCallback(async (d: number, loc: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(d) });
      if (loc) params.set("locationId", loc);
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(days, locationId); }, [days, locationId, fetchData]);

  const KPI = ({
    icon: Icon, label, value, sub, color,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
  }) => (
    <div className="card p-5 flex flex-col gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Analytics</p>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Reputação</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe o desempenho dos seus reviews ao longo do tempo.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Location filter */}
          {data && data.locations.length > 1 && (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="">Todos os locais</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  days === opt.value
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-200 bg-red-50 flex items-center justify-between gap-3">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => fetchData(days, locationId)}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800"
          >
            <RefreshCw size={12} /> Tentar novamente
          </button>
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-[120px]">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 bg-gray-100 rounded w-16 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            icon={TrendingUp}
            label="Reviews recebidos"
            value={data.totals.total}
            sub={`nos últimos ${days} dias`}
            color="bg-indigo-500"
          />
          <KPI
            icon={MessageSquare}
            label="Taxa de resposta"
            value={`${data.totals.replyRate}%`}
            sub={`${data.totals.published} respondidos`}
            color="bg-green-500"
          />
          <KPI
            icon={Star}
            label="Nota média"
            value={data.totals.avgRating > 0 ? data.totals.avgRating.toFixed(1) : "—"}
            sub="média das estrelas"
            color="bg-amber-500"
          />
          <KPI
            icon={Clock}
            label="Pendentes"
            value={data.totals.pending}
            sub="aguardando resposta"
            color="bg-rose-500"
          />
        </div>
      ) : null}

      {/* Charts row */}
      {!loading && data && (
        <>
          {/* Row 1: Reviews volume + Rating breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Reviews over time — 2/3 width */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Reviews {days > 14 ? "por semana" : "por dia"}
                </h2>
              </div>
              {data.reviewsPerDay.every((d) => d.total === 0) ? (
                <EmptyChart message="Nenhum review neste período" />
              ) : (
                <ReviewsBarChart data={data.reviewsPerDay} days={days} />
              )}
            </div>

            {/* Rating breakdown — 1/3 width */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Distribuição de estrelas</h2>
              </div>
              {data.ratingBreakdown.every((d) => d.count === 0) ? (
                <EmptyChart message="Nenhum review neste período" />
              ) : (
                <RatingBarChart data={data.ratingBreakdown} />
              )}
            </div>
          </div>

          {/* Row 2: Rating evolution — full width */}
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Evolução da nota média</h2>
              </div>
              {data.totals.avgRating > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {data.totals.avgRating.toFixed(1)} média geral
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Nota média {days <= 14 ? "por dia" : "por semana"} nos últimos {days} dias
            </p>
            {data.ratingEvolution.every((d) => d.count === 0) ? (
              <EmptyChart message="Nenhum review com nota neste período" />
            ) : (
              <RatingLineChart
                data={data.ratingEvolution}
                days={days}
                overallAvg={data.totals.avgRating}
              />
            )}
          </div>
        </>
      )}

      {/* Bottom row */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Status dos reviews</h2>
            {data.statusBreakdown.length === 0 ? (
              <EmptyChart message="Nenhum review neste período" />
            ) : (
              <div className="space-y-3">
                {data.statusBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((s) => {
                    const pct = data.totals.total > 0
                      ? Math.round((s.count / data.totals.total) * 100)
                      : 0;
                    return (
                      <div key={s.status}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{s.label}</span>
                          <span className="font-medium">{s.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", STATUS_COLORS[s.status] ?? "bg-indigo-400")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Top locations */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top locais por reviews</h2>
            {data.topLocations.length === 0 ? (
              <EmptyChart message="Nenhum local com reviews" />
            ) : (
              <div className="space-y-3">
                {data.topLocations.map((loc, i) => {
                  const rate = loc.total > 0
                    ? Math.round((loc.published / loc.total) * 100)
                    : 0;
                  return (
                    <div key={loc.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-800 truncate">{loc.name}</span>
                          <span className="text-gray-500 shrink-0 ml-2">{loc.total} reviews · {rate}% resp.</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[120px] flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  );
}
