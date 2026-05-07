"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ReviewCard } from "./ReviewCard";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import type { Review } from "@/types";

interface ReviewListProps {
  reviews: Review[];
  locations: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: { status?: string; rating?: string; locationId?: string };
  highlightId?: string;
}

const STATUS_FILTERS = [
  { value: "",          label: "Todos" },
  { value: "pending",   label: "Pendentes" },
  { value: "draft",     label: "Rascunho" },
  { value: "published", label: "Publicados" },
  { value: "ignored",   label: "Ignorados" },
];

const RATING_FILTERS = [
  { value: "", label: "Todas" },
  { value: "1", label: "1★" },
  { value: "2", label: "2★" },
  { value: "3", label: "3★" },
  { value: "4", label: "4★" },
  { value: "5", label: "5★" },
];

export function ReviewList({ reviews, locations, total, page, pageSize, currentFilters, highlightId }: ReviewListProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / pageSize);
  const hasActiveFilter = !!(currentFilters.status || currentFilters.rating || currentFilters.locationId);

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <SlidersHorizontal size={13} />
          <span className="font-medium">Filtrar</span>
        </div>

        <div className="w-px h-4 bg-gray-200 shrink-0" />

        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter("status", f.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                (currentFilters.status ?? "") === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 shrink-0" />

        {/* Rating chips */}
        <div className="flex gap-1 flex-wrap">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter("rating", f.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                (currentFilters.rating ?? "") === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Location select */}
        {locations.length > 1 && (
          <>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <select
              value={currentFilters.locationId ?? ""}
              onChange={(e) => updateFilter("locationId", e.target.value)}
              className="text-xs bg-gray-100 border-0 rounded-md px-2.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Todos os locais</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </>
        )}

        {/* Count + reset */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{total} review{total !== 1 ? "s" : ""}</span>
          {hasActiveFilter && (
            <button
              onClick={() => router.push(pathname)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Nenhum review encontrado</p>
          <p className="text-xs text-gray-500">Tente ajustar os filtros acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              highlighted={review.id === highlightId}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-gray-500 font-medium px-2">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
