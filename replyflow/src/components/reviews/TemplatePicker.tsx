"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { getTemplates } from "@/lib/responseTemplates";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  niche:      string;
  rating:     number;
  authorName?: string | null;
  onSelect:   (text: string) => void;
}

export function TemplatePicker({ niche, rating, authorName, onSelect }: TemplatePickerProps) {
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);
  const templates           = getTemplates(niche, rating, authorName);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (templates.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
          "text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60",
          "hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
          open && "bg-indigo-50 dark:bg-indigo-900/30",
        )}
      >
        <Sparkles size={11} />
        Sugestões
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-80 rounded-xl border border-gray-200 dark:border-[#2a2a35] bg-white dark:bg-[#18181f] shadow-xl overflow-hidden animate-slide-up">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2a2a35] flex items-center gap-2">
            <Sparkles size={12} className="text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Modelos de resposta
            </span>
            <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
              Clique para usar
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-[#2a2a35]">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onSelect(t.text); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
              >
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  {t.label}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {t.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
