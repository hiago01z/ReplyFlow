"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NICHES = [
  { value: "clinica", label: "🏥 Clínica / Saúde" },
  { value: "restaurante", label: "🍽️ Restaurante / Alimentação" },
  { value: "academia", label: "💪 Academia / Fitness" },
  { value: "petshop", label: "🐾 Pet Shop / Veterinária" },
  { value: "barbearia", label: "✂️ Barbearia / Salão" },
  { value: "outro", label: "🏪 Outro" },
] as const;

const TONES = [
  { value: "amigavel", label: "😊 Amigável", description: "Próximo, caloroso e genuíno" },
  { value: "formal", label: "👔 Formal", description: "Profissional e respeitoso" },
  { value: "descontraido", label: "😎 Descontraído", description: "Informal mas profissional" },
] as const;

type Step = "welcome" | "business" | "location" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [niche, setNiche] = useState<string>("outro");
  const [tone, setTone] = useState<string>("amigavel");

  async function handleFinish() {
    if (!orgName.trim() || !locationName.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Criar organização
      const orgRes = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, locationName, niche, tone }),
      });

      if (!orgRes.ok) throw new Error("Falha ao criar organização");

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Algo deu errado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-indigo-600">ReplyFlow</span>
        </div>

        {/* Progress */}
        {step !== "done" && (
          <div className="flex gap-2 mb-8">
            {(["welcome", "business", "location"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  ["welcome", "business", "location"].indexOf(step) >= i
                    ? "bg-indigo-600"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step: Welcome */}
          {step === "welcome" && (
            <div className="text-center">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Bem-vindo ao ReplyFlow!
              </h1>
              <p className="text-gray-500 mb-8">
                Vamos configurar sua conta em menos de 2 minutos. Você vai precisar do nome
                do seu negócio e nada mais.
              </p>
              <button
                onClick={() => setStep("business")}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Começar configuração →
              </button>
            </div>
          )}

          {/* Step: Business */}
          {step === "business" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Como se chama sua empresa?
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Esse nome aparecerá nas respostas geradas pela IA.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex: Clínica Sorriso Perfeito"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => orgName.trim() && setStep("location")}
                  disabled={!orgName.trim()}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step: Location */}
          {step === "location" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Configure seu primeiro local
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Você pode adicionar mais locais depois.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do local
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Ex: Unidade Centro"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segmento do negócio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {NICHES.map((n) => (
                      <button
                        key={n.value}
                        type="button"
                        onClick={() => setNiche(n.value)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                          niche === n.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tom das respostas
                  </label>
                  <div className="space-y-2">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                          tone === t.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-medium text-gray-900">{t.label}</span>
                        <span className="text-gray-500 ml-2">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleFinish}
                  disabled={loading || !locationName.trim()}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Configurando..." : "Finalizar configuração →"}
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Tudo pronto!
              </h2>
              <p className="text-gray-500 text-sm">
                Redirecionando para o dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
