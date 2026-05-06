"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/types";

interface ReviewListProps {
  reviews: Review[];
  locations: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: {
    status?: string;
    rating?: string;
    locationId?: string;
  };
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicados" },
  { value: "ignored", label: "Ignorados" },
];

const RATING_FILTERS = [
  { value: "", label: "Todas" },
  { value: "1", label: "1★" },
  { value: "2", label: "2★" },
  { value: "3", label: "3★" },
  { value: "4", label: "4★" },
  { value: "5", label: "5★" },
];

export function ReviewList({
  reviews,
  locations,
  total,
  page,
  pageSize,
  currentFilters,
}: ReviewListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-4">
        {/* Status */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter("status", f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (currentFilters.status ?? "") === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divisor */}
        <div className="w-px bg-gray-100 self-stretch" />

        {/* Rating */}
        <div className="flex gap-1 flex-wrap">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter("rating", f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (currentFilters.rating ?? "") === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Local */}
        {locations.length > 1 && (
          <>
            <div className="w-px bg-gray-100 self-stretch" />
            <select
              value={currentFilters.locationId ?? ""}
              onChange={(e) => updateFilter("locationId", e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Todos os locais</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Lista */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500">Nenhum review encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
