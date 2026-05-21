"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X, Zap, Crown, CheckCircle2, Lock } from "lucide-react";

export interface UpgradeModalProps {
  open:         boolean;
  onClose:      () => void;
  /** Razão do bloqueio — exibida no topo do modal */
  reason?:      "response_limit" | "location_limit" | "whatsapp" | "report" | "bulk" | "trial_expired" | "tone";
}

const REASON_COPY: Record<NonNullable<UpgradeModalProps["reason"]>, { title: string; subtitle: string }> = {
  response_limit: {
    title:    "Você atingiu o limite de 30 respostas do plano Free",
    subtitle: "Faça upgrade para o Starter ou Pro e tenha respostas IA ilimitadas.",
  },
  trial_expired: {
    title:    "Seu período de avaliação expirou",
    subtitle: "Continue gerando respostas automáticas com IA — escolha um plano abaixo.",
  },
  location_limit: {
    title:    "Limite de locais atingido",
    subtitle: "Adicione mais locais fazendo upgrade do seu plano.",
  },
  whatsapp: {
    title:    "Alertas via WhatsApp são exclusivos do plano Pro",
    subtitle: "Receba notificações de reviews negativos direto no seu celular.",
  },
  report: {
    title:    "Relatório PDF mensal — plano Pro ou Agência",
    subtitle: "Analise tendências e compartilhe relatórios com clientes.",
  },
  bulk: {
    title:    "Ações em lote disponíveis no plano Starter+",
    subtitle: "Gere e publique respostas para múltiplos reviews de uma vez.",
  },
  tone: {
    title:    "Tom personalizado disponível no plano Starter+",
    subtitle: "Escolha entre Amigável, Formal ou Descontraído para personalizar a voz da IA.",
  },
};

const PLANS = [
  {
    key:      "starter" as const,
    name:     "Starter",
    price:    "R$ 27",
    icon:     <Zap size={18} className="text-blue-500" />,
    color:    "blue",
    features: [
      "1 local",
      "Respostas IA ilimitadas",
      "3 plataformas conectadas",
      "Alerta por e-mail",
    ],
    highlight: false,
  },
  {
    key:      "pro" as const,
    name:     "Pro",
    price:    "R$ 97",
    icon:     <Crown size={18} className="text-indigo-500" />,
    color:    "indigo",
    features: [
      "Tudo do Starter +",
      "Até 3 locais",
      "Todas as plataformas",
      "Alerta via WhatsApp",
      "Aprovação em 1 clique",
      "Relatório mensal PDF",
    ],
    highlight: true,
  },
];

export function UpgradeModal({ open, onClose, reason = "response_limit" }: UpgradeModalProps) {
  const copy = REASON_COPY[reason];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#18181f] rounded-2xl shadow-xl p-0 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header gradient */}
          <div className="brand-gradient px-6 pt-6 pb-8 relative">
            <Dialog.Close
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </Dialog.Close>

            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <Lock size={20} className="text-white" />
            </div>
            <Dialog.Title className="text-lg font-bold text-white leading-snug">
              {copy.title}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-white/80 mt-1">
              {copy.subtitle}
            </Dialog.Description>
          </div>

          {/* Plans */}
          <div className="px-6 py-5 grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-xl border p-4 flex flex-col gap-3 ${
                  plan.highlight
                    ? "border-indigo-400 ring-1 ring-indigo-400/20 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-700"
                    : "border-gray-200 dark:border-[#2a2a35]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wide whitespace-nowrap">
                    MAIS POPULAR
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{plan.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {plan.price}<span className="text-xs font-normal text-gray-400">/mês</span>
                </p>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => f.endsWith(" +") ? (
                    <li key={f} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>✦</span>{f}
                    </li>
                  ) : (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/billing"
                  onClick={onClose}
                  className={`mt-1 w-full py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20"
                  }`}
                >
                  Assinar {plan.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Sem fidelidade · cancele quando quiser
            </p>
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Agora não
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
