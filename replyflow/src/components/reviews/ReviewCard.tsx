"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Sparkles, Send, EyeOff, RotateCcw, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  highlighted?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: "amber" | "blue" | "teal" | "green" | "gray" }> = {
  pending:   { label: "Pendente",  color: "amber" },
  draft:     { label: "Rascunho",  color: "blue" },
  approved:  { label: "Aprovado",  color: "teal" },
  published: { label: "Publicado", color: "green" },
  ignored:   { label: "Ignorado",  color: "gray" },
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          className={cn(
            size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
            n <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200",
          )}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewCard({
  review,
  highlighted = false,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ReviewCardProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();
  const [responseText, setResponseText] = useState(review.response?.content ?? "");
  const [generating, setGenerating]     = useState(false);
  const [publishing, setPublishing]     = useState(false);
  const [expanded, setExpanded]         = useState(
    highlighted || review.status === "pending" || review.status === "draft"
  );
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll highlighted card into view on mount
  useEffect(() => {
    if (!highlighted) return;
    const timer = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [highlighted]);

  const statusCfg = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending;
  const publishedDate = review.platform_published_at
    ? new Date(review.platform_published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  const isNegative = (review.rating ?? 5) <= 2;
  const isEditable = review.status !== "published" && review.status !== "ignored";

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/generate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.error === 'plan_limit') {
        toastError("Limite atingido 🔒", data.message ?? "Faça upgrade para gerar mais respostas.");
        return;
      }

      if (res.status === 402 && data?.error === 'openai_quota') {
        toastError("Créditos OpenAI esgotados 💳", data.message ?? "Acesse platform.openai.com/billing para recarregar.");
        return;
      }

      if (res.status === 429 && data?.error === 'rate_limit') {
        toastError("Muitas requisições ⏳", "Aguarde alguns segundos e tente novamente.");
        return;
      }

      if (res.ok) {
        const content = data?.response?.content;
        if (!content) {
          toastError("Erro ao gerar", "A IA não retornou conteúdo. Tente novamente.");
          return;
        }
        setResponseText(content);
        router.refresh();
        success("Resposta gerada!", "A IA criou uma resposta personalizada.");
      } else {
        const msg = data?.message ?? data?.error ?? "Erro desconhecido";
        if (res.status === 401) {
          toastError("Sessão expirada", "Faça login novamente.");
        } else if (res.status === 403) {
          toastError("Sem permissão", "Você não tem acesso a este review.");
        } else if (res.status === 502 && data?.error === 'openai_auth') {
          toastError("Chave OpenAI inválida 🔑", "Verifique a variável OPENAI_API_KEY.");
        } else if (res.status === 502) {
          toastError("Erro na IA", msg);
        } else {
          toastError(`Erro ${res.status}`, msg);
        }
      }
    } catch {
      toastError("Erro de rede", "Verifique sua conexão e tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!responseText.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseContent: responseText }),
      });
      if (res.ok) {
        router.refresh();
        success("Resposta publicada!", "A resposta foi publicada no Google.");
      } else {
        toastError("Erro ao publicar", "Não foi possível publicar. Verifique a conexão com o Google.");
      }
    } catch {
      toastError("Erro ao publicar", "Verifique sua conexão e tente novamente.");
    } finally { setPublishing(false); }
  }

  async function handleIgnore() {
    try {
      await fetch(`/api/reviews/${review.id}/ignore`, { method: "POST" });
      router.refresh();
      info("Review ignorado", "Este review não aparecerá mais como pendente.");
    } catch {
      toastError("Erro", "Não foi possível ignorar o review.");
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "card overflow-hidden transition-shadow hover:shadow-md",
        isNegative && review.status === "pending" && "border-red-200",
        highlighted && "ring-2 ring-indigo-400 ring-offset-1",
      )}
    >
      {/* ── Header row ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Bulk select checkbox */}
          {selectable && (
            <div
              role="checkbox"
              aria-checked={selected}
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              className={cn(
                "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                selected
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-gray-300 bg-white hover:border-indigo-400",
              )}
            >
              {selected && (
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-none stroke-white stroke-2">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </div>
          )}
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {(review.author_name?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {review.author_name ?? "Anônimo"}
              </span>
              <Stars rating={review.rating ?? 0} />
              {publishedDate && (
                <span className="text-xs text-gray-400">{publishedDate}</span>
              )}
              {review.location && (
                <span className="text-xs text-gray-400">
                  · {(review.location as { name: string }).name}
                </span>
              )}
            </div>
            {review.content
              ? <p className="text-sm text-gray-600 line-clamp-1 leading-relaxed">{review.content}</p>
              : <p className="text-xs text-gray-400 italic">Sem comentário</p>
            }
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isNegative && review.status === "pending" && (
            <span className="hidden sm:inline text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Crítico
            </span>
          )}
          <Badge color={statusCfg.color} dot>{statusCfg.label}</Badge>
          {expanded
            ? <ChevronUp size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400" />
          }
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 animate-slide-up">
          {/* Full review text */}
          {review.content && (
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3.5">
              <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
            </div>
          )}

          {/* Response area */}
          {isEditable && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Resposta {responseText ? "— editável" : ""}
                </span>
                {!responseText ? (
                  <Button size="sm" onClick={handleGenerate} loading={generating} className="gap-1.5">
                    <Sparkles size={13} />
                    Gerar com IA
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={handleGenerate} loading={generating} className="gap-1.5 text-indigo-600">
                    <RotateCcw size={13} />
                    Gerar novamente
                  </Button>
                )}
              </div>

              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Clique em 'Gerar com IA' para criar uma resposta automaticamente…"
                rows={4}
                className="text-sm"
              />

              {responseText && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handlePublish} loading={publishing} className="gap-1.5 bg-green-600 hover:bg-green-700">
                    <Send size={13} />
                    Publicar resposta
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleIgnore} className="gap-1.5 text-gray-500">
                    <EyeOff size={13} />
                    Ignorar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Published response */}
          {review.status === "published" && review.response && (
            <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Resposta publicada</span>
              </div>
              <p className="text-sm text-green-900 leading-relaxed">{review.response.content}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
