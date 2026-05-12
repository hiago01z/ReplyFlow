"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, Star, Clock, CheckCircle2,
  Sparkles, Send, ChevronDown, ChevronUp, Loader2, Wifi, WifiOff, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientLocation {
  id: string; name: string; niche: string | null;
  active: boolean; google_connected: boolean; auto_publish: boolean;
}

interface ClientDetail {
  id: string; name: string; plan: string; created_at: string;
  stats: { pending: number; published: number; total: number; locations: number };
}

interface ReviewItem {
  id: string; author_name: string | null; rating: number | null;
  content: string | null; status: string; created_at: string;
  location: { id: string; name: string; niche: string | null } | null;
  response: { id: string; content: string } | null;
}

const NICHE_LABELS: Record<string, string> = {
  restaurante: "🍽️", clinica: "🏥", academia: "💪",
  salao: "✂️", petshop: "🐾", hotel: "🏨", outro: "🏢",
};

const STAR_COLORS: Record<number, string> = {
  1: "text-red-500", 2: "text-orange-400", 3: "text-yellow-400",
  4: "text-lime-500", 5: "text-green-500",
};

// ── Review Card ───────────────────────────────────────────────────────────────

function AgencyReviewCard({
  review, clientId, onUpdate,
}: {
  review: ReviewItem;
  clientId: string;
  onUpdate: () => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [draft,       setDraft]       = useState(review.response?.content ?? "");
  const [generating,  setGenerating]  = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [published,   setPublished]   = useState(review.status === "published");

  const stars = review.rating ?? 0;
  const base  = `/api/agency/clients/${clientId}/reviews/${review.id}`;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res  = await fetch(`${base}/generate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.response?.content) {
        setDraft(data.response.content);
        setExpanded(true);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!draft.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`${base}/publish`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ responseContent: draft }),
      });
      if (res.ok) {
        setPublished(true);
        onUpdate();
      }
    } finally {
      setPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/40">
        <CheckCircle2 size={15} className="text-green-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">{review.author_name ?? "Anônimo"}</p>
          <p className="text-xs text-green-600 dark:text-green-400 truncate">{review.content?.slice(0, 60)}</p>
        </div>
        <span className="text-xs text-green-600 dark:text-green-400 shrink-0">Publicado ✓</span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header do review */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600 dark:text-gray-300">
          {(review.author_name ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.author_name ?? "Anônimo"}</p>
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", STAR_COLORS[stars] ?? "text-gray-400")}>
              {"★".repeat(stars)}{"☆".repeat(5 - stars)}
            </span>
            {review.location && (
              <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full truncate max-w-[140px]">
                {NICHE_LABELS[review.location.niche ?? ""] ?? "🏢"} {review.location.name}
              </span>
            )}
          </div>
          {review.content && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{review.content}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.status === "draft" && (
            <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
              Rascunho
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Painel expandido */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/10 pt-3 space-y-3">
          {review.content && (
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">"{review.content}"</p>
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Rascunho da resposta..."
            className="w-full px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors placeholder:text-gray-400"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {draft ? "Regerar" : "Gerar com IA"}
            </button>

            {draft && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !draft.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Publicar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgencyClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter();

  const [client,    setClient]    = useState<ClientDetail | null>(null);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [reviews,   setReviews]   = useState<ReviewItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<"reviews" | "locations">("reviews");
  const [removing,  setRemoving]  = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, reviewsRes] = await Promise.all([
        fetch(`/api/agency/clients/${clientId}`),
        fetch(`/api/agency/clients/${clientId}/reviews`),
      ]);
      if (detailRes.ok) {
        const d = await detailRes.json();
        setClient(d.client);
        setLocations(d.locations ?? []);
      }
      if (reviewsRes.ok) {
        const r = await reviewsRes.json();
        setReviews(r.reviews ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRemoveClient() {
    if (!confirm(`Remover "${client?.name}" da agência? Os dados do cliente não serão deletados.`)) return;
    setRemoving(true);
    const res = await fetch(`/api/agency/clients/${clientId}`, { method: "DELETE" });
    if (res.ok) router.push("/agency");
    else setRemoving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24" />)}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-16" />)}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-gray-500">Cliente não encontrado.</p>
        <button onClick={() => router.push("/agency")} className="mt-3 text-xs text-indigo-600 hover:underline">
          ← Voltar
        </button>
      </div>
    );
  }

  const { stats } = client;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/agency")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-[#2a2a35] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-0.5">Agência → Cliente</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {client.name}
              <span className="text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize">
                {client.plan}
              </span>
            </h1>
          </div>
        </div>
        <button
          onClick={handleRemoveClient}
          disabled={removing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={12} />
          Remover cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Locais",           value: stats.locations,  icon: MapPin,       color: "bg-blue-500" },
          { label: "Pendentes",        value: stats.pending,    icon: Clock,        color: "bg-amber-500" },
          { label: "Publicados",       value: stats.published,  icon: CheckCircle2, color: "bg-green-500" },
          { label: "Total de reviews", value: stats.total,      icon: Star,         color: "bg-indigo-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4 flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", kpi.color)}>
              <kpi.icon size={14} className="text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-[#2a2a35]">
        {(["reviews", "locations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {t === "reviews" ? `Reviews (${reviews.length})` : `Locais (${locations.length})`}
          </button>
        ))}
      </div>

      {/* Reviews tab */}
      {tab === "reviews" && (
        <div>
          {reviews.length === 0 ? (
            <div className="card p-10 text-center">
              <CheckCircle2 size={24} className="text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum review pendente</p>
              <p className="text-xs text-gray-400 mt-1">Todos os reviews deste cliente já foram respondidos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <AgencyReviewCard
                  key={r.id}
                  review={r}
                  clientId={clientId}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Locations tab */}
      {tab === "locations" && (
        <div>
          {locations.length === 0 ? (
            <div className="card p-10 text-center">
              <Building2 size={24} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum local cadastrado para este cliente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="card px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-base">
                      {NICHE_LABELS[loc.niche ?? ""] ?? "🏢"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{loc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{loc.niche ?? "sem nicho"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loc.google_connected ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        <Wifi size={10} /> Google conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        <WifiOff size={10} /> Sem conexão
                      </span>
                    )}
                    {loc.auto_publish && (
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                        Auto
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
