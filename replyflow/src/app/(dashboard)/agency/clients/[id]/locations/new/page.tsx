"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { MapPin, ChevronLeft, CheckCircle2, Zap } from "lucide-react";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgencyNewLocationPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [name,        setName]        = useState("");
  const [niche,       setNiche]       = useState<string>("outro");
  const [tone,        setTone]        = useState<string>("amigavel");
  const [autoPublish, setAutoPublish] = useState(false);
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agency/clients/${clientId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), niche, tone, auto_publish: autoPublish }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Erro ao criar local", data.message ?? data.error ?? "Tente novamente.");
        return;
      }
      success("Local criado!", `"${name}" foi adicionado com sucesso.`);
      router.push(`/agency/clients/${clientId}/locations/${data.location.id}`);
    } catch {
      toastError("Erro ao criar local", "Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/agency/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft size={15} />
          Voltar para o cliente
        </Link>
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Agência → Cliente → Locais</p>
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
                  tone === t.value
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 hover:bg-gray-50",
                )}
              >
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
                {tone === t.value && (
                  <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-publicar — em breve */}
        <div className="card p-6 opacity-70">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={16} className="text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-gray-500">Publicação automática no Google</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 tracking-wide">EM BREVE</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                A IA publicará respostas direto no Google automaticamente. Disponível assim que a integração automática for ativada.
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading} disabled={!name.trim()} className="flex-1 sm:flex-none">
            Criar local
          </Button>
          <Link href={`/agency/clients/${clientId}`}>
            <Button type="button" variant="ghost" className="text-gray-500">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
