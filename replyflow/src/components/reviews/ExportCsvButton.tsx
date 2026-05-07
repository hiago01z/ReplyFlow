"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportCsvButtonProps {
  locationIds: string[];
  filters: {
    status?: string;
    rating?: string;
    locationId?: string;
    search?: string;
  };
}

export function ExportCsvButton({ filters }: ExportCsvButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status)     params.set("status",     filters.status);
      if (filters.rating)     params.set("rating",     filters.rating);
      if (filters.locationId) params.set("locationId", filters.locationId);
      if (filters.search)     params.set("search",     filters.search);

      const res = await fetch(`/api/reviews/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      title="Exportar para CSV"
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <Download size={13} />
      }
      Exportar CSV
    </button>
  );
}
