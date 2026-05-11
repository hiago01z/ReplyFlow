"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, ChevronDown, Plus, X, Loader2, Check } from "lucide-react";
import { getTemplates } from "@/lib/responseTemplates";
import { cn } from "@/lib/utils";

interface CustomTemplate {
  id:    string;
  title: string;
  text:  string;
}

interface TemplatePickerProps {
  niche:      string;
  rating:     number;
  authorName?: string | null;
  onSelect:   (text: string) => void;
}

export function TemplatePicker({ niche, rating, authorName, onSelect }: TemplatePickerProps) {
  const [open,     setOpen]     = useState(false);
  const [custom,   setCustom]   = useState<CustomTemplate[]>([]);
  const [loaded,   setLoaded]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showNew,  setShowNew]  = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const containerRef            = useRef<HTMLDivElement>(null);

  const builtins = getTemplates(niche, rating, authorName);

  // Fetch custom templates when first opened
  const fetchCustom = useCallback(async () => {
    if (loaded) return;
    try {
      const res  = await fetch(`/api/templates?niche=${encodeURIComponent(niche)}&rating=${rating}`);
      if (!res.ok) return;
      const data = await res.json();
      // Map API response to local shape
      setCustom(
        (data.custom ?? []).map((t: { id: string; title: string; content: string }) => ({
          id:   t.id,
          title: t.title,
          text:  t.content,
        }))
      );
    } catch {/* silent */} finally {
      setLoaded(true);
    }
  }, [niche, rating, loaded]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) fetchCustom();
  }

  async function handleSaveCustom(text: string) {
    if (!newTitle.trim() || !text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:      newTitle,
          content:    text,
          niche,
          min_rating: rating,
          max_rating: rating,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustom((prev) => [{ id: saved.id, title: saved.title, text: saved.content }, ...prev]);
        setNewTitle("");
        setShowNew(false);
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      setCustom((prev) => prev.filter((t) => t.id !== id));
    } finally { setDeleting(null); }
  }

  const hasAny = builtins.length > 0 || custom.length > 0;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleOpen}
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
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2a2a35] flex items-center gap-2">
            <Sparkles size={12} className="text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Modelos de resposta
            </span>
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Salvar template personalizado"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Save-current-text form */}
          {showNew && (
            <SaveTemplateForm
              onSave={handleSaveCustom}
              onCancel={() => setShowNew(false)}
              saving={saving}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
            />
          )}

          {/* Template list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-[#2a2a35]">
            {!hasAny && (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400">Nenhum template para {rating}★.</p>
              </div>
            )}

            {/* Custom templates first */}
            {custom.map((t) => (
              <TemplateRow
                key={t.id}
                label={t.title}
                text={t.text}
                badge="Meu"
                onUse={() => { onSelect(t.text); setOpen(false); }}
                onDelete={() => handleDelete(t.id)}
                deleting={deleting === t.id}
              />
            ))}

            {/* Built-in templates */}
            {builtins.map((t) => (
              <TemplateRow
                key={t.id}
                label={t.label}
                text={t.text}
                onUse={() => { onSelect(t.text); setOpen(false); }}
              />
            ))}
          </div>

          {hasAny && (
            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-[#2a2a35]">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Clique em um modelo para usar · <button onClick={() => setShowNew(true)} className="text-indigo-500 hover:underline">Salvar modelo próprio</button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TemplateRow({
  label, text, badge, onUse, onDelete, deleting,
}: {
  label: string; text: string; badge?: string;
  onUse: () => void; onDelete?: () => void; deleting?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative flex items-start gap-2 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onUse}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {badge && (
            <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wide">
              {badge}
            </span>
          )}
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
            {label}
          </p>
        </div>
        <p className={cn(
          "text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed transition-all",
          hovered ? "line-clamp-3" : "line-clamp-1",
        )}>
          {text}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-all"
            title="Excluir"
          >
            {deleting
              ? <Loader2 size={11} className="animate-spin" />
              : <X size={11} />
            }
          </button>
        )}
      </div>
    </div>
  );
}

function SaveTemplateForm({
  onSave, onCancel, saving, newTitle, setNewTitle,
}: {
  onSave: (text: string) => void;
  onCancel: () => void;
  saving: boolean;
  newTitle: string;
  setNewTitle: (v: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#2a2a35] bg-indigo-50/40 dark:bg-indigo-900/10 space-y-2">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">Salvar como template personalizado:</p>
      <input
        autoFocus
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Nome do template…"
        className="w-full text-xs border border-gray-200 dark:border-[#2a2a35] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Texto da resposta… use {author} para o nome do cliente."
        rows={3}
        className="w-full text-xs border border-gray-200 dark:border-[#2a2a35] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(text)}
          disabled={saving || !newTitle.trim() || !text.trim()}
          className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          Salvar
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}
