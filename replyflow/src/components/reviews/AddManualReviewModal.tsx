"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Info, Sparkles, RotateCcw, CheckCircle2, Copy, Save } from "lucide-react";

interface Props {
  locationId:       string;
  platform:         "google" | "tripadvisor" | "facebook" | "reclame_aqui" | "booking" | "ifood";
  googleUrl?:       string | null;
  tripadvisorUrl?:  string | null;
  reclamaAquiUrl?:  string | null;
  bookingUrl?:      string | null;
  ifoodUrl?:        string | null;
  onClose:          () => void;
  onAdded:          () => void;
}

const PLATFORM_LABEL: Record<string, string> = {
  google:       "Google",
  tripadvisor:  "TripAdvisor",
  facebook:     "Facebook",
  reclame_aqui: "Reclame Aqui",
  booking:      "Booking.com",
  ifood:        "iFood",
};

const PLATFORM_COLOR: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  google:       { bg: "bg-[#4285F4]/10", border: "border-[#4285F4]/30", text: "text-[#2b6cb0]", icon: "text-[#4285F4]" },
  tripadvisor:  { bg: "bg-[#00AF87]/10", border: "border-[#00AF87]/30", text: "text-[#007a62]", icon: "text-[#00AF87]" },
  reclame_aqui: { bg: "bg-[#E8281C]/10", border: "border-[#E8281C]/30", text: "text-[#a31a12]", icon: "text-[#E8281C]" },
  booking:      { bg: "bg-[#003580]/10", border: "border-[#003580]/30", text: "text-[#002a66]", icon: "text-[#003580]" },
  ifood:        { bg: "bg-[#EA1D2C]/10", border: "border-[#EA1D2C]/30", text: "text-[#b81520]", icon: "text-[#EA1D2C]" },
  facebook:     { bg: "bg-[#1877F2]/10", border: "border-[#1877F2]/30", text: "text-[#1254b0]", icon: "text-[#1877F2]" },
};

const PLATFORM_INSTRUCTIONS: Record<string, { title: string; steps: string[]; linkLabel: string }> = {
  google: {
    title: "Como importar do Google:",
    steps: ["Abra seu perfil no Google Maps", "Vá em Avaliações do negócio", "Copie o texto da avaliação", "Cole no campo abaixo"],
    linkLabel: "Abrir meu perfil no Google Maps",
  },
  tripadvisor: {
    title: "Como importar do TripAdvisor:",
    steps: ["Abra sua página no TripAdvisor", "Copie o texto da avaliação", "Cole no campo abaixo"],
    linkLabel: "Abrir minha página no TripAdvisor",
  },
  reclame_aqui: {
    title: "Como importar do Reclame Aqui:",
    steps: ["Acesse sua empresa no Reclame Aqui", "Abra a reclamação que deseja responder", "Copie o texto", "Cole no campo abaixo"],
    linkLabel: "Abrir minha página no Reclame Aqui",
  },
  booking: {
    title: "Como importar do Booking.com:",
    steps: ["Acesse sua Extranet no Booking.com", "Vá em Avaliações de hóspedes", "Copie o texto da avaliação", "Cole no campo abaixo"],
    linkLabel: "Abrir minha propriedade no Booking.com",
  },
  ifood: {
    title: "Como importar do iFood:",
    steps: ["Acesse o Gestor iFood (portal.ifood.com.br)", "Vá em Avaliações do seu restaurante", "Copie o texto da avaliação", "Cole no campo abaixo"],
    linkLabel: "Abrir meu restaurante no iFood",
  },
};

type Phase = "form" | "generating" | "response" | "saving";

export function AddManualReviewModal({
  locationId, platform,
  googleUrl, tripadvisorUrl, reclamaAquiUrl, bookingUrl, ifoodUrl,
  onClose, onAdded,
}: Props) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [authorName,  setAuthorName]  = useState("");
  const [rating,      setRating]      = useState(5);
  const [content,     setContent]     = useState("");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));

  // ── Flow state ────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState<Phase>("form");
  const [reviewId,     setReviewId]     = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState("");

  const colors = PLATFORM_COLOR[platform] ?? PLATFORM_COLOR.tripadvisor;
  const instructions = PLATFORM_INSTRUCTIONS[platform];
  const platformUrl = platform === "google"       ? googleUrl
    : platform === "tripadvisor"  ? tripadvisorUrl
    : platform === "reclame_aqui" ? reclamaAquiUrl
    : platform === "booking"      ? bookingUrl
    : platform === "ifood"        ? ifoodUrl
    : null;

  // ── Step 1: Gerar resposta com IA ─────────────────────────────────────────
  async function handleGenerate() {
    if (!authorName.trim() || !content.trim()) return;
    setError("");
    setPhase("generating");

    try {
      // 1. Criar o review
      const createRes = await fetch("/api/reviews/manual", {
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
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setError(createData.error ?? "Erro ao criar avaliação.");
        setPhase("form");
        return;
      }
      const newReviewId: string = createData.review.id;
      setReviewId(newReviewId);

      // 2. Gerar resposta com IA
      const genRes = await fetch(`/api/reviews/${newReviewId}/generate`, { method: "POST" });
      const genData = await genRes.json().catch(() => ({}));

      if (!genRes.ok) {
        const msg = genData?.message ?? genData?.error ?? "Erro ao gerar resposta.";
        setError(msg);
        setPhase("form"); // volta ao formulário, review já criado (ficará como pending)
        return;
      }

      setResponseText(genData.response?.content ?? "");
      setPhase("response");
    } catch {
      setError("Erro de rede. Tente novamente.");
      setPhase("form");
    }
  }

  // ── Regenerar (já tem reviewId) ────────────────────────────────────────────
  async function handleRegenerate() {
    if (!reviewId) return;
    setError("");
    setPhase("generating");
    try {
      const genRes = await fetch(`/api/reviews/${reviewId}/generate`, { method: "POST" });
      const genData = await genRes.json().catch(() => ({}));
      if (!genRes.ok) {
        setError(genData?.message ?? genData?.error ?? "Erro ao gerar resposta.");
        setPhase("response");
        return;
      }
      setResponseText(genData.response?.content ?? "");
      setPhase("response");
    } catch {
      setError("Erro de rede.");
      setPhase("response");
    }
  }

  // ── Step 2: Salvar como publicado ─────────────────────────────────────────
  async function handleSave() {
    if (!reviewId || !responseText.trim()) return;
    setError("");
    setPhase("saving");
    try {
      const res = await fetch(`/api/reviews/${reviewId}/save-manual`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseContent: responseText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        setPhase("response");
        return;
      }
      onAdded();
    } catch {
      setError("Erro de rede.");
      setPhase("response");
    }
  }

  // ── Copiar resposta ────────────────────────────────────────────────────────
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch { /* silent */ }
  }

  const isLoading = phase === "generating" || phase === "saving";
  const isFormPhase = phase === "form" || phase === "generating";
  const isResponsePhase = phase === "response" || phase === "saving";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">
            Adicionar avaliação do {PLATFORM_LABEL[platform]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Instrução da plataforma */}
        {instructions && isFormPhase && (
          <div className={`mb-4 ${colors.bg} border ${colors.border} rounded-xl px-4 py-3 flex items-start gap-3`}>
            <Info size={15} className={`${colors.icon} mt-0.5 shrink-0`} />
            <div className={`text-xs ${colors.text} space-y-1`}>
              <p className="font-semibold">{instructions.title}</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {instructions.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {platformUrl && (
                <a
                  href={platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold mt-1.5 hover:underline"
                >
                  <ExternalLink size={11} />
                  {instructions.linkLabel}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── FASE 1: Formulário ─────────────────────────────────────────── */}
        {isFormPhase && (
          <div className="space-y-4">
            {/* Nome do autor */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do autor</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                disabled={phase === "generating"}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Nota */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Nota</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    disabled={phase === "generating"}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50 ${
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Texto da avaliação</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole aqui o texto da avaliação..."
                rows={4}
                required
                disabled={phase === "generating"}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data da avaliação</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                disabled={phase === "generating"}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={phase === "generating"}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={phase === "generating" || !authorName.trim() || !content.trim()}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {phase === "generating"
                  ? <><Loader2 size={13} className="animate-spin" /> Gerando resposta…</>
                  : <><Sparkles size={13} /> Gerar resposta com IA</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 2: Resposta gerada ────────────────────────────────────── */}
        {isResponsePhase && (
          <div className="space-y-4">
            {/* Resumo da avaliação (readonly) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                <span className="text-xs text-amber-500">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{publishedAt}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-3">{content}</p>
            </div>

            {/* Resposta da IA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Resposta gerada pela IA</label>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={phase === "saving"}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                >
                  <RotateCcw size={11} />
                  Gerar novamente
                </button>
              </div>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                disabled={phase === "saving"}
                className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-indigo-50/40 disabled:opacity-60"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Edite a resposta acima se necessário. Após salvar, não será possível editar.
              </p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1 flex-wrap">
              {/* Copiar */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!responseText.trim()}
                className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg border transition-colors disabled:opacity-40 ${
                  copied
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>

              {platformUrl && (
                <a
                  href={platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <ExternalLink size={13} />
                  Abrir plataforma
                </a>
              )}

              <div className="flex-1" />

              {/* Cancelar */}
              <button
                type="button"
                onClick={onClose}
                disabled={phase === "saving"}
                className="h-9 px-3 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40"
              >
                Cancelar
              </button>

              {/* Salvar como publicado */}
              <button
                type="button"
                onClick={handleSave}
                disabled={phase === "saving" || !responseText.trim()}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {phase === "saving"
                  ? <><Loader2 size={13} className="animate-spin" /> Salvando…</>
                  : <><Save size={13} /> Salvar como publicado</>
                }
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              Cole a resposta na plataforma antes ou depois de salvar. O review ficará marcado como publicado para análise.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
