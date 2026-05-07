"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Sparkles, CheckCircle2, Zap, Wifi } from "lucide-react";

const NICHES = [
  { value: "clinica",     label: "Clínica / Saúde",       icon: "🏥" },
  { value: "restaurante", label: "Restaurante",            icon: "🍽️" },
  { value: "academia",    label: "Academia / Fitness",     icon: "💪" },
  { value: "petshop",     label: "Pet Shop",               icon: "🐾" },
  { value: "barbearia",   label: "Barbearia / Salão",      icon: "✂️" },
  { value: "outro",       label: "Outro",                  icon: "🏪" },
] as const;

const TONES = [
  { value: "amigavel",    label: "Amigável",     desc: "Próximo, caloroso e genuíno",       icon: "😊" },
  { value: "formal",      label: "Formal",       desc: "Profissional e respeitoso",         icon: "👔" },
  { value: "descontraido",label: "Descontraído", desc: "Informal mas profissional",         icon: "😎" },
] as const;

type Step = "business" | "location" | "connect" | "done";

const STEPS: { key: Step; label: string; Icon: React.ElementType }[] = [
  { key: "business",  label: "Empresa",  Icon: Building2 },
  { key: "location",  label: "Local",    Icon: MapPin },
  { key: "connect",   label: "Google",   Icon: Wifi },
  { key: "done",      label: "Pronto",   Icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step,    setStep]    = useState<Step>("business");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [orgName,       setOrgName]       = useState("");
  const [locationName,  setLocationName]  = useState("");
  const [niche,         setNiche]         = useState("outro");
  const [tone,          setTone]          = useState("amigavel");

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  async function handleFinish() {
    if (!orgName.trim() || !locationName.trim()) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, locationName, niche, tone }),
      });
      if (!res.ok) throw new Error();
      setStep("connect");
    } catch {
      setError("Algo deu errado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow-sm">
          <Zap size={15} className="text-white fill-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">ReplyFlow</span>
      </Link>

      {/* Step indicators */}
      {step !== "done" && (
        <div className="flex items-center gap-1 mb-8">
          {STEPS.filter((s) => s.key !== "done").map((s, i) => {
            const activeSteps = STEPS.filter((x) => x.key !== "done");
            const cur = activeSteps.findIndex((x) => x.key === step);
            const done = i < cur;
            const active = i === cur;
            return (
              <div key={s.key} className="flex items-center gap-1">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active  ? "bg-indigo-600 text-white"           : "",
                  done    ? "bg-indigo-100 text-indigo-600"      : "",
                  !active && !done ? "bg-gray-100 text-gray-400" : "",
                )}>
                  {done
                    ? <CheckCircle2 size={12} />
                    : <s.Icon size={12} />
                  }
                  {s.label}
                </div>
                {i < activeSteps.length - 1 && (
                  <div className={cn("w-6 h-px", done ? "bg-indigo-300" : "bg-gray-200")} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md card p-7 animate-slide-up">

        {/* Step: Business */}
        {step === "business" && (
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
              <Building2 size={22} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Como se chama sua empresa?</h2>
            <p className="text-sm text-gray-500 mb-6">Esse nome aparecerá nas respostas geradas pela IA.</p>
            <div className="space-y-4">
              <Input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ex: Clínica Sorriso Perfeito"
                autoFocus
              />
              <Button
                size="lg"
                className="w-full"
                onClick={() => orgName.trim() && setStep("location")}
                disabled={!orgName.trim()}
              >
                Continuar →
              </Button>
            </div>
          </div>
        )}

        {/* Step: Location */}
        {step === "location" && (
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
              <MapPin size={22} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Configure seu primeiro local</h2>
            <p className="text-sm text-gray-500 mb-6">Você pode adicionar mais locais depois.</p>
            <div className="space-y-5">
              <Input
                label="Nome do local"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Unidade Centro"
                autoFocus
              />

              {/* Nicho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segmento do negócio</label>
                <div className="grid grid-cols-3 gap-2">
                  {NICHES.map((n) => (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => setNiche(n.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs font-medium transition-all",
                        niche === n.value
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <span className="text-lg">{n.icon}</span>
                      <span className="text-center leading-tight">{n.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tom das respostas</label>
                <div className="space-y-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        tone === t.value
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      <span className="text-xl shrink-0">{t.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-500">{t.desc}</p>
                      </div>
                      {tone === t.value && (
                        <CheckCircle2 size={16} className="text-indigo-500 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleFinish}
                loading={loading}
                disabled={!locationName.trim()}
              >
                <Sparkles size={15} />
                Finalizar configuração
              </Button>
            </div>
          </div>
        )}

        {/* Step: Connect Google */}
        {step === "connect" && (
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
              <Wifi size={22} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Conecte o Google Meu Negócio</h2>
            <p className="text-sm text-gray-500 mb-6">
              O ReplyFlow precisa de acesso para monitorar seus reviews e publicar respostas automaticamente.
            </p>

            <div className="space-y-3">
              <a
                href="/api/google/auth"
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Conectar com Google
              </a>

              <button
                type="button"
                onClick={() => {
                  setStep("done");
                  setTimeout(() => router.push("/dashboard"), 1600);
                }}
                className="w-full py-2.5 px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pular por agora → conectar depois em Locais
              </button>
            </div>

            <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>🔒 Seguro:</strong> o ReplyFlow solicita apenas permissão para ler reviews e publicar respostas. Nenhum outro dado é acessado.
              </p>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={30} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tudo pronto! 🎉</h2>
            <p className="text-sm text-gray-500">Redirecionando para o dashboard…</p>
            <div className="mt-5 flex gap-1 justify-center">
              {[0,1,2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
