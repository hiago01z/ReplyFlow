"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Step {
  id:       string;
  label:    string;
  detail:   string;
  href?:    string;
  cta?:     string;
  done:     boolean;
}

interface Props {
  hasGoogleConnected:  boolean;
  hasFirstResponse:    boolean;
  hasAutoPublish:      boolean;
}

const STORAGE_KEY = "replyflow_onboarding_dismissed";

export function OnboardingChecklist({
  hasGoogleConnected,
  hasFirstResponse,
  hasAutoPublish,
}: Props) {
  const [visible,   setVisible]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const steps: Step[] = [
    {
      id:    "account",
      label: "Criar conta",
      detail: "Sua conta está pronta.",
      done:   true,
    },
    {
      id:    "google",
      label: "Vincular uma plataforma",
      detail: "Cole a URL do seu negócio (Google, TripAdvisor, Booking...) para começar a importar avaliações.",
      href:  "/locations",
      cta:   "Ir para Locais →",
      done:  hasGoogleConnected,
    },
    {
      id:    "response",
      label: "Gerar primeira resposta com IA",
      detail: 'Clique em um review pendente e depois em "Gerar com IA".',
      href:  "/reviews",
      cta:   "Ver reviews →",
      done:  hasFirstResponse,
    },
    {
      id:    "autopublish",
      label: "Publicação automática (em breve)",
      detail: "Em breve: o ReplyFlow publicará respostas direto no Google automaticamente.",
      href:  "/locations",
      cta:   "Configurar local →",
      done:  hasAutoPublish,
    },
  ];

  const doneCount  = steps.filter((s) => s.done).length;
  const allDone    = doneCount === steps.length;
  const progress   = Math.round((doneCount / steps.length) * 100);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="card border-indigo-100 bg-indigo-50/40 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{doneCount}/{steps.length}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-900">
              {allDone ? "Configuração completa! 🎉" : "Primeiros passos"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-32 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] text-indigo-500 font-medium">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Dispensar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-indigo-100 divide-y divide-indigo-100">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "px-5 py-3 flex items-start gap-3 transition-colors",
                step.done ? "opacity-60" : "bg-white/60",
              )}
            >
              <div className="mt-0.5 shrink-0">
                {step.done
                  ? <CheckCircle2 size={16} className="text-indigo-500" />
                  : <Circle       size={16} className="text-indigo-300" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  step.done ? "text-gray-500 line-through" : "text-gray-900",
                )}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>
                )}
              </div>
              {!step.done && step.href && step.cta && (
                <Link
                  href={step.href}
                  className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
