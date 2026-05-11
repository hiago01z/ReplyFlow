"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wifi, CheckCircle2, Loader2, Search, ExternalLink,
  ChevronRight, Copy, Check, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GmbAccount {
  accountName: string;
  accountDisplayName: string;
  locations: { name: string; title: string }[];
}

interface GmbLinkWizardProps {
  locationId:          string;
  googleLocationName:  string | null;
  googleAccessToken:   string | null;
}

// ── Step visual component ────────────────────────────────────────────────────
function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        done
          ? "bg-green-500 text-white"
          : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
      )}>
        {done ? <Check size={12} /> : n}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-medium transition-colors"
    >
      {copied ? <><Check size={10} /> Copiado!</> : <><Copy size={10} /> Copiar</>}
    </button>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────
export function GmbLinkWizard({ locationId, googleLocationName, googleAccessToken }: GmbLinkWizardProps) {
  const router = useRouter();

  const [mode,         setMode]         = useState<"idle" | "auto" | "manual">("idle");
  const [accounts,     setAccounts]     = useState<GmbAccount[]>([]);
  const [selected,     setSelected]     = useState(googleLocationName ?? "");
  const [fetching,     setFetching]     = useState(false);
  const [errorCode,    setErrorCode]    = useState<string | null>(null);
  const [cooldown,     setCooldown]     = useState(0);
  const [manualInput,  setManualInput]  = useState(googleLocationName ?? "");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  // ── Auto-detect ────────────────────────────────────────────────────────────
  async function detectAuto() {
    if (cooldown > 0) return;
    setMode("auto");
    setFetching(true);
    setErrorCode(null);
    setAccounts([]);
    try {
      const res  = await fetch(`/api/google/locations?locationId=${locationId}`);
      const data = await res.json();
      if (data.ok) {
        setAccounts(data.accounts ?? []);
        const first = data.accounts?.[0]?.locations?.[0]?.name;
        if (first && !selected) setSelected(first);
      } else {
        setErrorCode(data.error ?? "unknown");
        if (data.error === "rate_limit") {
          let s = 60;
          setCooldown(s);
          const t = setInterval(() => { s--; setCooldown(s); if (s <= 0) clearInterval(t); }, 1000);
        }
      }
    } catch {
      setErrorCode("network");
    } finally {
      setFetching(false);
    }
  }

  // ── Save location name to DB ───────────────────────────────────────────────
  async function save(locationName: string) {
    if (!locationName.trim()) return;
    setSaving(true);
    try {
      const parts           = locationName.split("/");
      const googleAccountId = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
      const res = await fetch(`/api/locations/${locationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ google_location_name: locationName, google_account_id: googleAccountId }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } catch {
      setErrorCode("save_failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Already linked ─────────────────────────────────────────────────────────
  if (googleLocationName) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Google Meu Negócio vinculado</p>
          <p className="text-xs text-green-600 dark:text-green-400 truncate mt-0.5">{googleLocationName}</p>
        </div>
        <button
          type="button"
          onClick={() => { setMode("manual"); setManualInput(googleLocationName); }}
          className="text-xs text-green-700 hover:text-green-900 underline shrink-0"
        >
          Alterar
        </button>
      </div>
    );
  }

  // ── Not connected at all ───────────────────────────────────────────────────
  if (!googleAccessToken) {
    return (
      <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#2a2a35] rounded-xl px-4 py-3">
        <Wifi size={15} className="text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Conecte o Google primeiro para vincular o local.
        </p>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Local vinculado com sucesso!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Option A: Auto-detect ── */}
      <div className={cn(
        "border rounded-xl overflow-hidden transition-all",
        mode === "auto"
          ? "border-indigo-300 dark:border-indigo-700"
          : "border-gray-200 dark:border-[#2a2a35]",
      )}>
        <button
          type="button"
          onClick={detectAuto}
          disabled={fetching || cooldown > 0}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            {fetching
              ? <Loader2 size={15} className="text-indigo-500 animate-spin" />
              : <Search size={15} className="text-indigo-500" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Detectar automaticamente</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {fetching
                ? "Buscando seu negócio no Google…"
                : cooldown > 0
                  ? `Aguarde ${cooldown}s antes de tentar novamente`
                  : "Busca e vincula o seu Google Meu Negócio automaticamente"
              }
            </p>
          </div>
          <ChevronRight size={15} className="text-gray-400 shrink-0" />
        </button>

        {/* Auto-detect results */}
        {mode === "auto" && !fetching && (
          <div className="border-t border-gray-100 dark:border-[#2a2a35] px-4 pb-4 pt-3 space-y-3">
            {/* Error */}
            {errorCode && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
                <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  {errorCode === "rate_limit"
                    ? <><strong>Aguarde um momento.</strong> O Google limitou as tentativas. {cooldown > 0 ? `Liberado em ${cooldown}s.` : "Tente novamente."}</>
                    : errorCode === "no_accounts"
                      ? <><strong>Nenhum negócio encontrado.</strong> Use a opção manual abaixo.</>
                    : errorCode === "no_locations"
                      ? <><strong>Conta encontrada, mas sem locais.</strong> Verifique se o perfil foi criado em business.google.com.</>
                    : <><strong>Não foi possível detectar.</strong> Use a opção manual abaixo.</>
                  }
                </div>
              </div>
            )}

            {/* Found locations */}
            {accounts.map((acc) =>
              acc.locations.map((loc) => (
                <label
                  key={loc.name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    selected === loc.name
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-[#2a2a35] hover:bg-gray-50 dark:hover:bg-white/5",
                  )}
                >
                  <input
                    type="radio"
                    name="gmbLocation"
                    value={loc.name}
                    checked={selected === loc.name}
                    onChange={() => setSelected(loc.name)}
                    className="accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{loc.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{loc.name}</p>
                  </div>
                  {selected === loc.name && <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />}
                </label>
              ))
            )}

            {accounts.length > 0 && (
              <button
                type="button"
                onClick={() => save(selected)}
                disabled={saving || !selected}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Vincular local selecionado
              </button>
            )}

            {/* Retry */}
            {errorCode && cooldown === 0 && (
              <button
                type="button"
                onClick={detectAuto}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <RefreshCw size={11} /> Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Option B: Manual ── */}
      <div className={cn(
        "border rounded-xl overflow-hidden transition-all",
        mode === "manual"
          ? "border-indigo-300 dark:border-indigo-700"
          : "border-gray-200 dark:border-[#2a2a35]",
      )}>
        <button
          type="button"
          onClick={() => setMode(mode === "manual" ? "idle" : "manual")}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-sm">🔗</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Inserir ID manualmente</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Copie o ID do Google Business Profile e cole aqui — leva menos de 1 minuto
            </p>
          </div>
          <ChevronRight size={15} className={cn("text-gray-400 shrink-0 transition-transform", mode === "manual" && "rotate-90")} />
        </button>

        {mode === "manual" && (
          <div className="border-t border-gray-100 dark:border-[#2a2a35] px-4 pb-5 pt-4 space-y-4">

            {/* Step-by-step guide */}
            <div className="space-y-3">
              <Step n={1} label="Abra o Google Business Profile" />
              <div className="ml-8">
                <a
                  href="https://business.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink size={13} />
                  Abrir business.google.com
                </a>
              </div>

              <Step n={2} label='Clique no seu negócio e depois em "Editar perfil"' />

              <Step n={3} label="Olhe a URL do navegador e copie o número:" />
              <div className="ml-8 space-y-2">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                  business.google.com/u/0/edit/l/
                  <span className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 px-1 rounded font-bold">
                    NÚMERO_AQUI
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Copie só o número amarelo — esse é o ID do local.
                </p>
              </div>

              <Step n={4} label="Cole o ID abaixo e clique em Vincular:" />
              <div className="ml-8 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ex: 7391827364819203"
                    className="flex-1 text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200 font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Pode colar só o número ou o caminho completo{" "}
                  <span className="font-mono">accounts/xxx/locations/yyy</span>
                  <CopyButton text="accounts/ACCOUNT_ID/locations/LOCATION_ID" />
                </p>
              </div>
            </div>

            {/* Error */}
            {errorCode === "save_failed" && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                <AlertCircle size={13} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">Erro ao salvar. Tente novamente.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                // Accept bare number or full path
                const raw = manualInput.trim();
                const locationName = raw.includes("/") ? raw : `accounts/me/locations/${raw}`;
                save(locationName);
              }}
              disabled={saving || !manualInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Vincular local
            </button>

          </div>
        )}
      </div>

    </div>
  );
}
