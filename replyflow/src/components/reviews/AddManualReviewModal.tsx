"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Info } from "lucide-react";

interface Props {
  locationId:       string;
  platform:         "tripadvisor" | "facebook" | "reclame_aqui" | "booking";
  tripadvisorUrl?:  string | null;
  reclamaAquiUrl?:  string | null;
  bookingUrl?:      string | null;
  onClose:          () => void;
  onAdded:          () => void;
}

const PLATFORM_LABEL: Record<string, string> = {
  tripadvisor:  "TripAdvisor",
  facebook:     "Facebook",
  reclame_aqui: "Reclame Aqui",
  booking:      "Booking.com",
};

export function AddManualReviewModal({ locationId, platform, tripadvisorUrl, reclamaAquiUrl, bookingUrl, onClose, onAdded }: Props) {
  const [authorName,  setAuthorName]  = useState("");
  const [rating,      setRating]      = useState(5);
  const [content,     setContent]     = useState("");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/reviews/manual", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          platform,
          authorName: authorName.trim(),
          rating,
          content:    content.trim(),
          publishedAt: new Date(publishedAt).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar avaliação.");
        return;
      }
      onAdded();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">
            Adicionar avaliação do {PLATFORM_LABEL[platform]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Instrução para TripAdvisor */}
        {platform === "tripadvisor" && (
          <div className="mb-4 bg-[#00AF87]/10 border border-[#00AF87]/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info size={15} className="text-[#00AF87] mt-0.5 shrink-0" />
            <div className="text-xs text-[#007a62] space-y-1">
              <p className="font-semibold">Como importar do TripAdvisor:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Abra sua página no TripAdvisor</li>
                <li>Copie o texto da avaliação</li>
                <li>Cole no campo abaixo</li>
              </ol>
              {tripadvisorUrl && (
                <a
                  href={tripadvisorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold mt-1.5 hover:underline"
                >
                  <ExternalLink size={11} />
                  Abrir minha página no TripAdvisor
                </a>
              )}
            </div>
          </div>
        )}

        {/* Instrução para Reclame Aqui */}
        {platform === "reclame_aqui" && (
          <div className="mb-4 bg-[#E8281C]/10 border border-[#E8281C]/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info size={15} className="text-[#E8281C] mt-0.5 shrink-0" />
            <div className="text-xs text-[#a31a12] space-y-1">
              <p className="font-semibold">Como importar do Reclame Aqui:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Acesse sua empresa no Reclame Aqui</li>
                <li>Abra a reclamação que deseja responder</li>
                <li>Copie o texto da reclamação</li>
                <li>Cole no campo abaixo e gere a resposta com IA</li>
              </ol>
              {reclamaAquiUrl && (
                <a
                  href={reclamaAquiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold mt-1.5 hover:underline"
                >
                  <ExternalLink size={11} />
                  Abrir minha página no Reclame Aqui
                </a>
              )}
            </div>
          </div>
        )}

        {/* Instrução para Booking.com */}
        {platform === "booking" && (
          <div className="mb-4 bg-[#003580]/10 border border-[#003580]/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info size={15} className="text-[#003580] mt-0.5 shrink-0" />
            <div className="text-xs text-[#002a66] space-y-1">
              <p className="font-semibold">Como importar do Booking.com:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Acesse sua Extranet no Booking.com</li>
                <li>Vá em Avaliações de hóspedes</li>
                <li>Copie o texto da avaliação que deseja responder</li>
                <li>Cole no campo abaixo e gere a resposta com IA</li>
              </ol>
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold mt-1.5 hover:underline"
                >
                  <ExternalLink size={11} />
                  Abrir minha propriedade no Booking.com
                </a>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do autor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nome do autor
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ex: João Silva"
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Nota
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    rating === s
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s}★
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Texto da avaliação
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o texto da avaliação..."
              rows={4}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Data de publicação */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Data da avaliação
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !authorName.trim() || !content.trim()}
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <><Loader2 size={13} className="animate-spin" /> Salvando…</> : "Adicionar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
