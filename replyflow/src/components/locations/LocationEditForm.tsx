"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { MapPin, Zap, Trash2, CheckCircle2, Wifi, Search, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import type { Location } from "@/types";

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

interface GmbAccount {
  accountName: string;
  accountDisplayName: string;
  locations: { name: string; title: string }[];
}

export function LocationEditForm({ location }: LocationEditFormProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [name,        setName]        = useState(location.name);
  const [niche,       setNiche]       = useState(location.niche);
  const [tone,        setTone]        = useState(location.tone);
  const [autoPublish,    setAutoPublish]    = useState(location.auto_publish);
  const [minRating,      setMinRating]      = useState(location.auto_publish_min_rating ?? 3);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  // GMB location picker
  const [gmbAccounts,   setGmbAccounts]   = useState<GmbAccount[]>([]);
  const [gmbSelected,   setGmbSelected]   = useState<string>(location.google_location_name ?? "");
  const [gmbFetching,   setGmbFetching]   = useState(false);
  const [gmbError,      setGmbError]      = useState<string | null>(null);
  const [gmbErrorCode,  setGmbErrorCode]  = useState<string | null>(null);
  const [gmbSaving,     setGmbSaving]     = useState(false);
  const [gmbManual,     setGmbManual]     = useState(false);
  const [gmbManualVal,  setGmbManualVal]  = useState(location.google_location_name ?? "");
  const [gmbCooldown,   setGmbCooldown]   = useState(0); // seconds remaining after rate limit

  const hasToken = !!location.google_access_token;

  async function fetchGmbLocations() {
    if (gmbCooldown > 0) return;
    setGmbFetching(true);
    setGmbError(null);
    setGmbErrorCode(null);
    setGmbAccounts([]);
    try {
      const res  = await fetch(`/api/google/locations?locationId=${location.id}`);
      const data = await res.json();
      if (data.ok) {
        setGmbAccounts(data.accounts ?? []);
        if (!gmbSelected && data.accounts?.[0]?.locations?.[0]?.name) {
          setGmbSelected(data.accounts[0].locations[0].name);
        }
      } else {
        setGmbErrorCode(data.error ?? null);
        setGmbError(data.message ?? "Não foi possível listar os locais.");
        // If rate limited, start a countdown so user knows when to retry
        if (data.error === "rate_limit") {
          let secs = 60;
          setGmbCooldown(secs);
          const timer = setInterval(() => {
            secs--;
            setGmbCooldown(secs);
            if (secs <= 0) clearInterval(timer);
          }, 1000);
        }
      }
    } catch {
      setGmbError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setGmbFetching(false);
    }
  }

  async function saveGmbLocation(locationName: string) {
    if (!locationName.trim()) return;
    setGmbSaving(true);
    try {
      // Derive google_account_id from resource name "accounts/xxx/locations/yyy"
      const parts = locationName.split("/");
      const googleAccountId = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;

      const res = await fetch(`/api/locations/${location.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          google_location_name: locationName,
          google_account_id:    googleAccountId,
        }),
      });
      if (!res.ok) throw new Error();
      success("Local GMB salvo!", "O local foi vinculado. Você pode sincronizar reviews agora.");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível salvar o local GMB.");
    } finally {
      setGmbSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, niche, tone, auto_publish: autoPublish, auto_publish_min_rating: minRating }),
      });
      if (!res.ok) throw new Error();
      success("Salvo!", "As configurações do local foram atualizadas.");
      router.refresh();
    } catch {
      toastError("Erro ao salvar", "Verifique sua conexão e tente novamente.");
    } finally {
      setSaving(false); }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await fetch(`/api/locations/${location.id}`, { method: "DELETE" });
      info("Local desativado", `"${location.name}" foi removido dos seus locais ativos.`);
      router.push("/locations");
      router.refresh();
    } catch {
      toastError("Erro", "Não foi possível desativar o local.");
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

      {/* Google My Business — vincular local */}
      {hasToken && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Wifi size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Vincular local do Google Meu Negócio</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {location.google_location_name
                  ? "Local vinculado. Você pode alterá-lo abaixo."
                  : "O local ainda não foi vinculado. Detecte ou insira manualmente."}
              </p>
            </div>
          </div>

          {/* Current state */}
          {location.google_location_name && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
              <code className="text-xs text-green-800 break-all">{location.google_location_name}</code>
            </div>
          )}

          {/* Detect button */}
          {!gmbManual && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={fetchGmbLocations}
                disabled={gmbFetching || gmbCooldown > 0}
                className="inline-flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {gmbFetching
                  ? <><Loader2 size={13} className="animate-spin" /> Buscando…</>
                  : gmbCooldown > 0
                    ? <><Loader2 size={13} className="animate-spin" /> Aguarde {gmbCooldown}s</>
                    : <><Search size={13} /> Detectar locais automaticamente</>
                }
              </button>
              <button
                type="button"
                onClick={() => setGmbManual(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Inserir manualmente
              </button>
            </div>
          )}

          {/* Error from API */}
          {gmbError && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                {gmbErrorCode === "rate_limit" ? (
                  <>
                    <p className="font-semibold">Muitas requisições — aguarde e tente novamente</p>
                    <p>{gmbError}</p>
                    {gmbCooldown > 0 && (
                      <p className="text-indigo-700 font-medium">
                        Botão liberado em {gmbCooldown}s…
                      </p>
                    )}
                  </>
                ) : gmbErrorCode === "permission_denied" ? (
                  <>
                    <p className="font-semibold">Permissão negada (403)</p>
                    <p>{gmbError}</p>
                  </>
                ) : gmbErrorCode === "unauthorized" ? (
                  <>
                    <p className="font-semibold">Token expirado — reconecte o Google</p>
                    <p>{gmbError}</p>
                    <a
                      href={`/api/google/auth?locationId=${location.id}`}
                      className="inline-block mt-1 text-indigo-700 underline font-semibold"
                    >
                      Reconectar Google →
                    </a>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Não foi possível detectar automaticamente</p>
                    <p>{gmbError}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Location list */}
          {gmbAccounts.length > 0 && (
            <div className="space-y-3">
              {gmbAccounts.map((acc) => (
                <div key={acc.accountName}>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {acc.accountDisplayName}
                  </p>
                  <div className="space-y-1.5">
                    {acc.locations.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhum local nesta conta.</p>
                    ) : acc.locations.map((loc) => (
                      <label
                        key={loc.name}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          gmbSelected === loc.name
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        <input
                          type="radio"
                          name="gmbLocation"
                          value={loc.name}
                          checked={gmbSelected === loc.name}
                          onChange={() => setGmbSelected(loc.name)}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{loc.title}</p>
                          <p className="text-[11px] text-gray-400 break-all mt-0.5">{loc.name}</p>
                        </div>
                        {gmbSelected === loc.name && (
                          <CheckCircle2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => saveGmbLocation(gmbSelected)}
                disabled={gmbSaving || !gmbSelected}
                className="inline-flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {gmbSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Vincular local selecionado
              </button>
            </div>
          )}

          {/* Manual entry */}
          {gmbManual && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Insira o nome do recurso no formato{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">accounts/XXXXXXX/locations/YYYYYYY</code>.
                Você encontra este ID no{" "}
                <a
                  href="https://business.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Google Business Profile
                </a>{" "}
                — URL do local após fazer login.
              </p>
              <div className="flex gap-2">
                <input
                  value={gmbManualVal}
                  onChange={(e) => setGmbManualVal(e.target.value)}
                  placeholder="accounts/123456789/locations/987654321"
                  className="flex-1 text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => saveGmbLocation(gmbManualVal)}
                  disabled={gmbSaving || !gmbManualVal.trim()}
                  className="inline-flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors shrink-0"
                >
                  {gmbSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setGmbManual(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 px-2 shrink-0"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Help: if no token */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <ChevronDown size={13} className="text-blue-500 shrink-0 mt-0.5 rotate-[-90deg]" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Não encontrou o local?</strong> Certifique-se de que{" "}
              <strong>mybusinessbusinessinformation.googleapis.com</strong> e{" "}
              <strong>mybusinessaccountmanagement.googleapis.com</strong> estão ativadas no Google Cloud Console
              e que o OAuth consent screen está configurado com o escopo{" "}
              <code className="bg-blue-100 px-1 rounded text-[10px]">business.manage</code>.
            </p>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          Salvar alterações
        </Button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors",
            confirmDel
              ? "bg-red-600 text-white hover:bg-red-700"
              : "text-red-500 hover:bg-red-50",
          )}
        >
          <Trash2 size={14} />
          {confirmDel ? "Confirmar remoção" : "Desativar local"}
        </button>
      </div>
      {confirmDel && (
        <p className="text-xs text-red-600 -mt-2">
          Clique em &quot;Confirmar remoção&quot; novamente para desativar. Esta ação pode ser revertida.
        </p>
      )}
    </form>
  );
}
