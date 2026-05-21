"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { cn } from "@/lib/utils";
import { MapPin, ChevronLeft, CheckCircle2, Lock } from "lucide-react";

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

interface NewLocationFormProps {
  plan: string;
}

export function NewLocationForm({ plan }: NewLocationFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const toneIsLocked = plan === "free";

  const [name,         setName]        = useState("");
  const [niche,        setNiche]       = useState<string>("outro");
  const [tone,         setTone]        = useState<string>(toneIsLocked ? "formal" : "amigavel");
  // auto_publish reservado para quando Google API for ativado (sprint futuro)
  // const [autoPublish, setAutoPublish] = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [upgradeOpen,   setUpgradeOpen]  = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"location_limit" | "tone">("location_limit");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          niche,
          tone: toneIsLocked ? "formal" : tone,
          auto_publish: false,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "plan_limit") {
        setUpgradeOpen(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "unknown");
      success("Local criado!", `"${name}" foi adicionado com sucesso.`);
      router.push("/locations");
      router.refresh();
    } catch {
      toastError("Erro ao criar local", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <UpgradeModal
        open={upgradeOpen}
        reason={upgradeReason}
        onClose={() => setUpgradeOpen(false)}
      />
      <div className="animate-fade-in max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            Voltar para Locais
          </Link>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Locais</p>
          <h1 className="text-2xl font-bold text-gray-900">Adicionar novo local</h1>
          <p className="text-sm text-gray-500 mt-1">Configure como a IA deve responder reviews deste local.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Identificação</h2>
                <p className="text-xs text-gray-500">Como este local será exibido no painel</p>
              </div>
            </div>
            <Input
              label="Nome do local"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Unidade Centro, Filial Paulista…"
              autoFocus
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
                const isLocked = toneIsLocked && t.value !== "formal";
                const isSelected = toneIsLocked ? t.value === "formal" : tone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      if (toneIsLocked) {
                        setUpgradeReason("tone");
                        setUpgradeOpen(true);
                      } else {
                        setTone(t.value);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      isSelected && !isLocked ? "border-indigo-400 bg-indigo-50" :
                      isSelected && toneIsLocked ? "border-indigo-400 bg-indigo-50" :
                      isLocked ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" :
                      "border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <span className={cn("text-xl shrink-0", isLocked && "grayscale")}>{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", isLocked ? "text-gray-400" : "text-gray-900")}>{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                    {isSelected && !isLocked && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
                    {isSelected && toneIsLocked && t.value === "formal" && <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />}
                    {isLocked && <Lock size={14} className="text-gray-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {toneIsLocked && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Tom personalizado disponível no plano Starter ou superior.{" "}
                <button type="button" onClick={() => { setUpgradeReason("tone"); setUpgradeOpen(true); }} className="font-semibold underline hover:no-underline">
                  Ver planos
                </button>
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading} disabled={!name.trim()} className="flex-1 sm:flex-none">
              Criar local
            </Button>
            <Link href="/locations">
              <Button type="button" variant="ghost" className="text-gray-500">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
