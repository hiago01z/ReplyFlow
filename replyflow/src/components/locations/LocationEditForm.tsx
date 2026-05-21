"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { MapPin, Zap, Trash2, CheckCircle2, Globe, Copy, ExternalLink, RefreshCw, PowerOff, X, AlertTriangle, Link2, Lock } from "lucide-react";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import type { UpgradeModalProps } from "@/components/ui/UpgradeModal";
import type { Location } from "@/types";
import { GoogleManualLinkWizard } from "@/components/locations/GoogleManualLinkWizard";
// GmbLinkWizard preserved for future Google API activation:
// import { GmbLinkWizard } from "@/components/locations/GmbLinkWizard";
import { TripAdvisorLinkWizard } from "@/components/locations/TripAdvisorLinkWizard";
import { ReclamaAquiLinkWizard } from "@/components/locations/ReclamaAquiLinkWizard";
import { BookingLinkWizard } from "@/components/locations/BookingLinkWizard";
import { IFoodLinkWizard } from "@/components/locations/IFoodLinkWizard";

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
  backHref?: string;
  plan?: string;
}

export function LocationEditForm({ location, backHref = "/locations", plan = "free" }: LocationEditFormProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const toneIsLocked = plan === "free";
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: UpgradeModalProps["reason"] }>({ open: false, reason: "response_limit" });

  const [name,        setName]        = useState(location.name);
  const [niche,       setNiche]       = useState(location.niche);
  const [tone,        setTone]        = useState(toneIsLocked ? "formal" : location.tone);
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
          tone: toneIsLocked ? "formal" : tone,
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
      router.push(backHref);
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
      router.push(backHref);
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível excluir o local.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <UpgradeModal
      open={upgradeModal.open}
      reason={upgradeModal.reason}
      onClose={() => setUpgradeModal((s) => ({ ...s, open: false }))}
    />
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
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-900">Tom das respostas</h2>
          {toneIsLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
              <Lock size={9} />
              Starter+
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">Define a personalidade da IA ao responder</p>
        <div className="space-y-2">
          {TONES.map((t) => {
            const isLocked   = toneIsLocked && t.value !== "formal";
            const isSelected = toneIsLocked ? t.value === "formal" : tone === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  if (toneIsLocked) { setUpgradeModal({ open: true, reason: "tone" }); }
                  else { setTone(t.value); }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                  isSelected ? "border-indigo-400 bg-indigo-50" :
                  isLocked   ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" :
                               "border-gray-200 hover:bg-gray-50",
                )}
              >
                <span className={cn("text-xl shrink-0", isLocked && "grayscale")}>{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", isLocked ? "text-gray-400" : "text-gray-900")}>{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
                {isSelected && !isLocked && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
                {isSelected && toneIsLocked  && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
                {isLocked                    && <Lock size={14} className="text-gray-300 shrink-0" />}
              </button>
            );
          })}
        </div>
        {toneIsLocked && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tom personalizado disponível no plano Starter ou superior.{" "}
            <button
              type="button"
              onClick={() => setUpgradeModal({ open: true, reason: "tone" })}
              className="font-semibold underline hover:no-underline"
            >
              Ver planos
            </button>
          </p>
        )}
      </div>

      {/* Auto-publicar — em breve */}
      <div className="card p-6 opacity-70">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={16} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-gray-500">Publicação automática no Google</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 tracking-wide">
                EM BREVE
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              A IA publicará respostas direto no Google automaticamente, com delay natural para parecer humano.
              Disponível assim que a integração automática com o Google for ativada.
            </p>
          </div>
        </div>
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

      {/* Google Meu Negócio — modo manual (API em aprovação) */}
      <div className="card p-6 space-y-4" id="google">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            location.google_connected ? "bg-green-50 dark:bg-green-900/30" : "bg-[#4285F4]/10",
          )}>
            <span className="text-base">📍</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Google Meu Negócio</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {location.google_connected
                ? "Local vinculado — importe avaliações manualmente."
                : "Vincule o perfil do Google para importar avaliações."}
            </p>
          </div>
        </div>
        <GoogleManualLinkWizard
          locationId={location.id}
          googleUrl={location.google_url ?? null}
          googleConnected={location.google_connected ?? false}
        />
        {/* TODO (Sprint Google API): quando mybusinessreviews.googleapis.com for aprovado,
            substituir GoogleManualLinkWizard por GmbLinkWizard + OAuth flow abaixo:
            import { GmbLinkWizard } from "@/components/locations/GmbLinkWizard";
            href={`/api/google/auth?locationId=${location.id}`}
        */}
      </div>

      {/* ── TripAdvisor ─────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4" id="tripadvisor">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#00AF87]/10 flex items-center justify-center shrink-0">
            <span className="text-base">🦉</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">TripAdvisor</h2>
            <p className="text-xs text-gray-500 mt-0.5">Avaliações importadas manualmente — IA gera a resposta</p>
          </div>
        </div>
        <TripAdvisorLinkWizard
          locationId={location.id}
          taUrl={location.tripadvisor_url}
          taConnected={location.tripadvisor_connected}
        />
      </div>

      {/* ── Facebook — TODO: oculto até aprovação Meta ──────────────────────────
           Integração implementada em /api/facebook/auth + /api/facebook/callback
           + /api/locations/[id]/facebook-pages. Reativar quando Meta aprovar as
           permissões pages_manage_engagement / pages_read_user_content.
      ──────────────────────────────────────────────────────────────────────── */}

      {/* ── Reclame Aqui ───────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4" id="reclame-aqui">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#E8281C]/10 flex items-center justify-center shrink-0">
            <span className="text-base">🔴</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Reclame Aqui</h2>
            <p className="text-xs text-gray-500 mt-0.5">Reclamações importadas manualmente — IA gera respostas empáticas</p>
          </div>
        </div>
        <ReclamaAquiLinkWizard
          locationId={location.id}
          raUrl={location.reclame_aqui_url}
          raConnected={location.reclame_aqui_connected}
        />
      </div>
      {/* ── Booking.com ──────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4" id="booking">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#003580]/10 flex items-center justify-center shrink-0">
            <span className="text-base">🏨</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Booking.com</h2>
            <p className="text-xs text-gray-500 mt-0.5">Avaliações importadas manualmente — IA gera respostas para hóspedes</p>
          </div>
        </div>
        <BookingLinkWizard
          locationId={location.id}
          bookingUrl={location.booking_url}
          bookingConnected={location.booking_connected}
        />
      </div>
      {/* ── iFood ────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4" id="ifood">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#EA1D2C]/10 flex items-center justify-center shrink-0">
            <span className="text-base">🍔</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">iFood</h2>
            <p className="text-xs text-gray-500 mt-0.5">Avaliações importadas manualmente — IA gera respostas para clientes</p>
          </div>
        </div>
        <IFoodLinkWizard
          locationId={location.id}
          ifoodUrl={location.ifood_url}
          ifoodConnected={location.ifood_connected}
        />
      </div>
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

      {/* ── Modal Upgrade (tom bloqueado) ── já gerenciado por UpgradeModal acima */}

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
    </>
  );
}
