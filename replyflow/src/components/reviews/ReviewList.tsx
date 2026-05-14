"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { ReviewCard } from "./ReviewCard";
import { cn } from "@/lib/utils";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  X, CheckSquare, Sparkles, Send, Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { Review } from "@/types";

interface ReviewListProps {
  reviews: Review[];
  locations: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: { status?: string; rating?: string; locationId?: string; search?: string; platform?: string };
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
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();

  // Search draft
  const [searchDraft, setSearchDraft] = useState(currentFilters.search ?? "");

  // Bulk selection state
  const [selectMode,  setSelectMode]  = useState(false);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<"generate" | "publish" | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  // Apenas plataformas com API podem ser selecionadas em lote.
  // Plataformas manuais (TripAdvisor, Reclame Aqui, Booking, iFood) têm fluxo próprio no modal.
  const API_PLATFORMS = new Set(["google", "facebook"]);
  const selectableIds = reviews
    .filter((r) => API_PLATFORMS.has(r.platform) && (r.status === "pending" || r.status === "draft"))
    .map((r) => r.id);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === selectableIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleBulk(action: "generate" | "publish") {
    const ids = [...selected].filter((id) => {
      const r = reviews.find((rv) => rv.id === id);
      if (!r) return false;
      if (action === "publish") return r.status === "draft";
      return r.status === "pending" || r.status === "draft";
    });
    if (ids.length === 0) return;

    setBulkLoading(action);
    setBulkProgress({ done: 0, total: ids.length });

    try {
      const res = await fetch("/api/reviews/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ids, action }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const label = action === "generate" ? "respostas geradas" : "reviews publicados";
        if (data.failed > 0) {
          toastError(
            `${data.succeeded} ${label}`,
            `${data.failed} falharam (limite de plano ou erro de publicação).`,
          );
        } else {
          success(`${data.succeeded} ${label}! 🎉`, "");
        }
        exitSelectMode();
        router.refresh();
      } else {
        toastError("Erro", "Não foi possível processar em lote.");
      }
    } finally {
      setBulkLoading(null);
    }
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const commitSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value.trim() ? params.set("search", value.trim()) : params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages    = Math.ceil(total / pageSize);
  const hasActiveFilter = !!(currentFilters.status || currentFilters.rating || currentFilters.locationId || currentFilters.search);
  const allSelected   = selectableIds.length > 0 && selected.size === selectableIds.length;
  const selectedCount = selected.size;

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="card p-3 space-y-2.5">
        {/* Row 1: Search + count + actions */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitSearch(searchDraft)}
              onBlur={() => commitSearch(searchDraft)}
              placeholder="Buscar por autor ou texto…"
              className="w-full h-8 pl-8 pr-7 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => { setSearchDraft(""); commitSearch(""); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Count + select toggle + reset */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-xs text-gray-400">{total} review{total !== 1 ? "s" : ""}</span>
            {hasActiveFilter && (
              <button
                onClick={() => router.push(pathname)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpar
              </button>
            )}
            {selectableIds.length > 0 && !selectMode && (
              <button
                onClick={() => setSelectMode(true)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-md px-2 py-1 transition-colors"
              >
                <CheckSquare size={12} />
                <span className="hidden sm:inline">Selecionar</span>
              </button>
            )}
            {selectMode && (
              <button
                onClick={exitSelectMode}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md px-2 py-1"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filter chips (horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
            <SlidersHorizontal size={12} />
          </div>

          {/* Status chips */}
          <div className="flex gap-1 shrink-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("status", f.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
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
          <div className="flex gap-1 shrink-0">
            {RATING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("rating", f.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
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
                className="text-xs bg-gray-100 border-0 rounded-md px-2.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shrink-0"
              >
                <option value="">Todos os locais</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ── Bulk action bar (floats when items selected) ── */}
      {selectMode && (
        <div className={cn(
          "card p-3 border-indigo-200 bg-indigo-50/60 transition-all",
          selectedCount > 0 ? "opacity-100" : "opacity-60",
        )}>
          <div className="flex flex-wrap items-center gap-2">
            {/* Select all toggle */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 shrink-0"
            >
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                allSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-400 bg-white",
              )}>
                {allSelected && <X size={10} className="text-white" />}
              </div>
              <span className="hidden sm:inline">{allSelected ? "Desmarcar todos" : `Todos (${selectableIds.length})`}</span>
            </button>

            <div className="text-xs text-indigo-700 font-medium flex-1 min-w-0">
              {selectedCount > 0 ? `${selectedCount} selecionado${selectedCount !== 1 ? "s" : ""}` : "Nenhum selecionado"}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleBulk("generate")}
                disabled={selectedCount === 0 || !!bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {bulkLoading === "generate"
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                <span className="hidden sm:inline">Gerar</span> respostas
              </button>
              <button
                onClick={() => handleBulk("publish")}
                disabled={selectedCount === 0 || !!bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {bulkLoading === "publish"
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Send size={12} />}
                Publicar
              </button>
            </div>
          </div>
          {bulkLoading && bulkProgress.total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-indigo-600 mb-1">
                <span>Processando…</span>
                <span>{bulkProgress.done}/{bulkProgress.total}</span>
              </div>
              <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

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
          {reviews.map((review) => {
            const isSelectable = selectMode && API_PLATFORMS.has(review.platform) && (review.status === "pending" || review.status === "draft");
            return (
              <ReviewCard
                key={review.id}
                review={review}
                highlighted={review.id === highlightId}
                selectable={isSelectable}
                selected={selected.has(review.id)}
                onToggleSelect={() => toggleSelect(review.id)}
              />
            );
          })}
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
