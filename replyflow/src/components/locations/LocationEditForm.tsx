"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { MapPin, Zap, Trash2, CheckCircle2, Globe, Copy, ExternalLink, RefreshCw, PowerOff, X, AlertTriangle, Link2, Plus } from "lucide-react";
import type { Location } from "@/types";
import { GmbLinkWizard } from "@/components/locations/GmbLinkWizard";
import { AddManualReviewModal } from "@/components/reviews/AddManualReviewModal";

const NICHES = [
  { value: "clinica",      label: "Clínica / Saúde",    icon: "🏥" },
  { value: "restaurante",  label: "Restaurante",         icon: "🍽️" },
  { value: "academia",     label: "Academia / Fitness",  icon: "💪" },
  { value: "petshop",      label: "Pet Shop",            icon: "🐾" },
  { value: "barbearia",    label: "Barbearia / Salão",   icon: "✂️" },
  { value: "outro",        label: "Outro",               icon: "🏪" },
] as const;

const TONES = [
  { value: "amigavel",     label: "Amigável",     desc: "Próximo, caloroso e genuíno",  icon: "😊" },
  { value: "formal",       label: "Formal",       desc: "Profissional e respeitoso",    icon: "👔" },
  { value: "descontraido", label: "Descontraído", desc: "Informal mas profissional",    icon: "😎" },
] as const;

interface LocationEditFormProps {
  location: Location;
}

export function LocationEditForm({ location }: LocationEditFormProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [name,        setName]        = useState(location.name);
  const [niche,       setNiche]       = useState(location.niche);
  const [tone,        setTone]        = useState(location.tone);
  const [autoPublish,    setAutoPublish]    = useState(location.auto_publish);
  const [minRating,      setMinRating]      = useState(location.auto_publish_min_rating ?? 3);
  const [isPublic,       setIsPublic]       = useState(location.is_public ?? false);
  const [publicSlug,     setPublicSlug]     = useState(location.public_slug ?? "");
  const [slugError,      setSlugError]      = useState<string | null>(null);
  const [copied,         setCopied]         = useState(false);
  const [saving,           setSaving]          = useState(false);
  const [deactivating,     setDeactivating]    = useState(false);
  const [showDeactivate,   setShowDeactivate]  = useState(false);
  const [showDelete,       setShowDelete]      = useState(false);
  const [deleting,         setDeleting]        = useState(false);
  const [relinking,        setRelinking]       = useState(false);

  // TripAdvisor
  const [taUrl,        setTaUrl]        = useState(location.tripadvisor_url ?? "");
  const [taConnected,  setTaConnected]  = useState(location.tripadvisor_connected);
  const [taSaving,     setTaSaving]     = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);

  // Facebook
  const [fbConnected,  setFbConnected]  = useState(location.facebook_connected);
  const [fbPageName,   setFbPageName]   = useState(location.facebook_page_name ?? "");
  const [fbDisconnecting, setFbDisconnecting] = useState(false);

  // Derive a default slug from the location name (only used as placeholder)
  const suggestedSlug = location.name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")  // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  function validateSlug(value: string): string | null {
    if (!value) return "O slug não pode estar vazio quando o perfil está público.";
    if (!/^[a-z0-9-]{3,60}$/.test(value))
      return "Apenas letras minúsculas, números e hífens (3–60 caracteres).";
    return null;
  }

  async function handleRelink() {
    setRelinking(true);
    try {
      const res = await fetch(`/api/locations/${location.id}/gmb-relink`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        if (data.newLocationName !== data.previousName) {
          success(
            "Local re-vinculado!",
            `Novo ID: ${data.newLocationName}. Reviews encontrados: ${data.reviewCount ?? 0}.`,
          );
          router.refresh();
        } else {
          info("Nenhuma mudança", `O ID já estava correto: ${data.newLocationName}.`);
        }
      } else {
        toastError("Falha no re-vínculo", data.error ?? "Tente novamente.");
      }
    } catch {
      toastError("Erro de rede", "Não foi possível re-vincular.");
    } finally {
      setRelinking(false);
    }
  }

  async function copyProfileLink() {
    const url = `${window.location.origin}/l/${publicSlug}`;
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate slug if public profile is enabled
    if (isPublic) {
      const err = validateSlug(publicSlug);
      if (err) { setSlugError(err); return; }
    }
    setSlugError(null);

    setSaving(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          niche,
          tone,
          auto_publish: autoPublish,
          auto_publish_min_rating: minRating,
          is_public: isPublic,
          public_slug: isPublic ? publicSlug.trim() : null,
        }),
      });
      if (!res.ok) throw new Error();
      success("Salvo!", "As configurações do local foram atualizadas.");
      router.refresh();
    } catch {
      toastError("Erro ao salvar", "Verifique sua conexão e tente novamente.");
    } finally {
      setSaving(false); }
  }

  async function handleSaveTripAdvisor() {
    if (!taUrl.trim()) return;
    setTaSaving(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tripadvisor_url: taUrl.trim(), tripadvisor_connected: true }),
      });
      if (!res.ok) throw new Error();
      setTaConnected(true);
      success("TripAdvisor vinculado!", "Você já pode adicionar avaliações manualmente.");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível vincular o TripAdvisor.");
    } finally {
      setTaSaving(false);
    }
  }

  async function handleDisconnectTripAdvisor() {
    setTaSaving(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tripadvisor_url: null, tripadvisor_connected: false }),
      });
      if (!res.ok) throw new Error();
      setTaConnected(false);
      setTaUrl("");
      info("TripAdvisor desvinculado.", "");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível desvincular.");
    } finally {
      setTaSaving(false);
    }
  }

  async function handleDisconnectFacebook() {
    setFbDisconnecting(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          facebook_page_id:      null,
          facebook_page_name:    null,
          facebook_access_token: null,
          facebook_connected:    false,
        }),
      });
      if (!res.ok) throw new Error();
      setFbConnected(false);
      setFbPageName("");
      info("Facebook desconectado.", "");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível desconectar.");
    } finally {
      setFbDisconnecting(false);
    }
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error();
      info("Local desativado", `"${location.name}" foi desativado. Reviews pausados.`);
      setShowDeactivate(false);
      router.push("/locations");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível desativar o local.");
    } finally {
      setDeactivating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      info("Local excluído", `"${location.name}" e todos os seus dados foram removidos.`);
      setShowDelete(false);
      router.push("/locations");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível excluir o local.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Nome */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Identificação</h2>
            <p className="text-xs text-gray-500">Nome exibido no painel</p>
          </div>
        </div>
        <Input
          label="Nome do local"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Nicho */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Segmento do negócio</h2>
        <p className="text-xs text-gray-500 mb-4">A IA adapta o vocabulário ao seu setor</p>
        <div className="grid grid-cols-3 gap-2">
          {NICHES.map((n) => (
            <button
              key={n.value}
              type="button"
              onClick={() => setNiche(n.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl border text-xs font-medium transition-all",
                niche === n.value
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50",
              )}
            >
              <span className="text-xl">{n.icon}</span>
              <span className="text-center leading-tight">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tom */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Tom das respostas</h2>
        <p className="text-xs text-gray-500 mb-4">Define a personalidade da IA ao responder</p>
        <div className="space-y-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                tone === t.value ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <span className="text-xl shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </div>
              {tone === t.value && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-publicar */}
      <div className="card p-6 space-y-4">
        {/* Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Publicação automática</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                A IA responde e publica no Google automaticamente, com delay de 5-20 minutos para parecer natural.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoPublish((v) => !v)}
            className={cn(
              "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
              autoPublish ? "bg-indigo-600" : "bg-gray-200",
            )}
            role="switch"
            aria-checked={autoPublish}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                autoPublish ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {/* Configuração de estrelas mínimas — só aparece quando ativo */}
        {autoPublish && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Publicar automaticamente reviews com:
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Reviews abaixo do mínimo ficam como rascunho para revisão manual.
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMinRating(star)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all",
                      minRating === star
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    <span className="text-base">{"★".repeat(star)}</span>
                    <span>{star}★+</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={cn(
              "rounded-lg px-3 py-2 text-xs",
              minRating <= 2
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-amber-50 border border-amber-200 text-amber-700",
            )}>
              {minRating === 1 && "⚠️ Todos os reviews serão respondidos automaticamente, incluindo críticas negativas."}
              {minRating === 2 && "⚠️ Reviews com 2★ ou mais serão publicados automaticamente. Reviews de 1★ ficam para revisão."}
              {minRating === 3 && "✅ Apenas reviews neutros e positivos (3★+) serão publicados automaticamente."}
              {minRating === 4 && "✅ Apenas reviews positivos (4★+) serão publicados automaticamente."}
              {minRating === 5 && "✅ Apenas reviews 5 estrelas serão publicados automaticamente."}
            </div>
          </div>
        )}
      </div>

      {/* Perfil Público */}
      <div className="card p-6 space-y-4">
        {/* Header + toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Globe size={16} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Perfil público</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Gere um link compartilhável com suas avaliações e respostas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={cn(
              "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
              isPublic ? "bg-indigo-600" : "bg-gray-200",
            )}
            role="switch"
            aria-checked={isPublic}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                isPublic ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {/* Slug + copy link (visible when public) */}
        {isPublic && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Slug do perfil
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Letras minúsculas, números e hífens. Ex.: <code className="bg-gray-100 px-1 rounded">{suggestedSlug || "meu-negocio"}</code>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">/l/</span>
                <input
                  type="text"
                  value={publicSlug}
                  onChange={(e) => {
                    setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSlugError(null);
                  }}
                  placeholder={suggestedSlug || "meu-negocio"}
                  className={cn(
                    "flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    slugError ? "border-red-300" : "border-gray-200",
                  )}
                />
              </div>
              {slugError && (
                <p className="text-xs text-red-600 mt-1">{slugError}</p>
              )}
            </div>

            {/* Link preview + copy */}
            {publicSlug && !slugError && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex-1 min-w-0 truncate">
                  {typeof window !== "undefined" ? window.location.origin : ""}/l/{publicSlug}
                </span>
                <button
                  type="button"
                  onClick={copyProfileLink}
                  title="Copiar link"
                  className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <a
                  href={`/l/${publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir perfil"
                  className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Apenas avaliações com status <strong>Publicado</strong> aparecem na página pública.
            </p>
          </div>
        )}
      </div>

      {/* Google My Business — always visible */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            location.google_access_token ? "bg-green-50 dark:bg-green-900/30" : "bg-gray-100 dark:bg-white/5",
          )}>
            <span className="text-base">📍</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Google Meu Negócio</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {location.google_location_name
                ? "Local vinculado — reviews sendo importados automaticamente."
                : location.google_access_token
                  ? "Conta conectada — vincule o local para importar avaliações."
                  : "Conecte o Google para importar avaliações automaticamente."}
            </p>
          </div>
        </div>

        {location.google_access_token ? (
          <>
            <GmbLinkWizard
              locationId={location.id}
              googleLocationName={location.google_location_name}
              googleAccessToken={location.google_access_token}
            />
            {/* Re-detect button: shown when a location name is set but reviews might be broken */}
            {location.google_location_name && (
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleRelink}
                  disabled={relinking}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={relinking ? "animate-spin" : ""} />
                  {relinking ? "Re-detectando..." : "Re-detectar local automaticamente"}
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  Use se as reviews não estiverem aparecendo.
                </span>
              </div>
            )}
          </>
        ) : (
          /* Not connected yet — show connect button */
          <a
            href={`/api/google/auth?locationId=${location.id}`}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".9"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
            </svg>
            Conectar Google Meu Negócio
          </a>
        )}
      </div>

      {/* ── TripAdvisor ─────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4" id="tripadvisor">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", taConnected ? "bg-green-50" : "bg-gray-100")}>
            <span className="text-base">🦉</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">TripAdvisor</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {taConnected
                ? "Vinculado — adicione avaliações manualmente para responder com IA."
                : "Cole a URL da sua página no TripAdvisor para vincular."}
            </p>
          </div>
          {taConnected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 size={11} /> Vinculado
            </span>
          )}
        </div>

        {!taConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={taUrl}
                onChange={(e) => setTaUrl(e.target.value)}
                placeholder="https://www.tripadvisor.com.br/Restaurant_Review-..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={handleSaveTripAdvisor}
                disabled={taSaving || !taUrl.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#00AF87] hover:bg-[#009975] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Link2 size={14} />
                {taSaving ? "Salvando…" : "Vincular"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              O TripAdvisor não possui API pública. Após vincular, você pode <strong>adicionar avaliações manualmente</strong> para que a IA gere respostas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Link2 size={13} className="text-gray-400 shrink-0" />
              <a
                href={taUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex-1 truncate"
              >
                {taUrl}
              </a>
              <ExternalLink size={12} className="text-gray-400 shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddReview(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#00AF87] hover:bg-[#009975] px-3 py-2 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Adicionar avaliação
              </button>
              <button
                type="button"
                onClick={handleDisconnectTripAdvisor}
                disabled={taSaving}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Desvincular
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Facebook — TODO: oculto até aprovação Meta ──────────────────────────
           Integração implementada em /api/facebook/auth + /api/facebook/callback
           + /api/locations/[id]/facebook-pages. Reativar quando Meta aprovar as
           permissões pages_manage_engagement / pages_read_user_content.
      ──────────────────────────────────────────────────────────────────────── */}

      {/* Modal: adicionar avaliação manual (TripAdvisor) */}
      {showAddReview && (
        <AddManualReviewModal
          locationId={location.id}
          platform="tripadvisor"
          tripadvisorUrl={location.tripadvisor_url}
          onClose={() => setShowAddReview(false)}
          onAdded={() => { setShowAddReview(false); router.refresh(); }}
        />
      )}

      {/* Botões */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          Salvar alterações
        </Button>

        <div className="flex items-center gap-2">
          {/* Desativar */}
          <button
            type="button"
            onClick={() => setShowDeactivate(true)}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <PowerOff size={14} />
            Desativar
          </button>

          {/* Excluir */}
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>

      {/* ── Modal Desativar ── */}
      {showDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Desativar local</h2>
              <button type="button" onClick={() => setShowDeactivate(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p><strong>"{location.name}"</strong> será desativado.</p>
                <p>O local permanece salvo no banco, mas não receberá nem enviará reviews enquanto estiver inativo.</p>
                <p>Se você tiver locais extras pagos, o slot será liberado e <strong>o valor reduzido na próxima cobrança</strong>.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDeactivate(false)} disabled={deactivating}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleDeactivate} disabled={deactivating}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50">
                {deactivating
                  ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Desativando…</>
                  : "Confirmar desativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Excluir ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Excluir local</h2>
              <button type="button" onClick={() => setShowDelete(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 space-y-1">
                <p><strong>Esta ação é irreversível.</strong></p>
                <p>O local <strong>"{location.name}"</strong>, todas as suas avaliações e respostas serão <strong>permanentemente removidos</strong>.</p>
                <p>Se você tiver locais extras pagos, o slot será cancelado e <strong>o valor reduzido na próxima cobrança</strong>.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 h-9 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                {deleting
                  ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Excluindo…</>
                  : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
