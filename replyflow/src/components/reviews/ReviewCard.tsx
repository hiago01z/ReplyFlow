"use client";

import { useState } from "react";
import type { Review } from "@/types";
import { useRouter } from "next/navigation";

interface ReviewCardProps {
  review: Review;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  draft: { label: "Rascunho", color: "bg-blue-100 text-blue-700" },
  approved: { label: "Aprovado", color: "bg-teal-100 text-teal-700" },
  published: { label: "Publicado", color: "bg-green-100 text-green-700" },
  ignored: { label: "Ignorado", color: "bg-gray-100 text-gray-500" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-amber-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const router = useRouter();
  const [responseText, setResponseText] = useState(review.response?.content ?? "");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expanded, setExpanded] = useState(review.status === "pending" || review.status === "draft");

  const status = STATUS_LABEL[review.status] ?? STATUS_LABEL.pending;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResponseText(data.response.content);
        router.refresh();
      }
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
      if (res.ok) router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  const publishedDate = review.platform_published_at
    ? new Date(review.platform_published_at).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
            {(review.author_name?.[0] ?? "?").toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">
                {review.author_name ?? "Anônimo"}
              </span>
              <Stars rating={review.rating ?? 0} />
              {publishedDate && (
                <span className="text-xs text-gray-400">{publishedDate}</span>
              )}
              {review.location && (
                <span className="text-xs text-gray-400">• {(review.location as { name: string }).name}</span>
              )}
            </div>
            {review.content && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{review.content}</p>
            )}
            {!review.content && (
              <p className="text-sm text-gray-400 italic mt-1">Sem comentário</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
          <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded area */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {review.content && (
            <div className="mt-4 mb-4 bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
            </div>
          )}

          {review.status !== "published" && review.status !== "ignored" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Resposta {responseText ? "(editável)" : ""}
                </label>
                {review.status === "pending" && !responseText && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {generating ? "Gerando..." : "✨ Gerar com IA"}
                  </button>
                )}
                {responseText && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    {generating ? "Gerando..." : "Gerar novamente"}
                  </button>
                )}
              </div>

              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Clique em 'Gerar com IA' para criar uma resposta automaticamente..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              {responseText && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handlePublish}
                    disabled={publishing || !responseText.trim()}
                    className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {publishing ? "Publicando..." : "✓ Publicar"}
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`/api/reviews/${review.id}/ignore`, { method: "POST" });
                      router.refresh();
                    }}
                    className="text-gray-500 px-5 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors"
                  >
                    Ignorar
                  </button>
                </div>
              )}
            </div>
          )}

          {review.status === "published" && review.response && (
            <div className="mt-4 bg-green-50 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-green-700 mb-1">Resposta publicada</p>
              <p className="text-sm text-green-900 leading-relaxed">{review.response.content}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
