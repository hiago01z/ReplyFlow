"use client";

import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse h-[120px]">
            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
            <div className="h-7 bg-gray-100 rounded w-16 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    ),
  },
);

export function AnalyticsDashboardClient() {
  return <AnalyticsDashboard />;
}
