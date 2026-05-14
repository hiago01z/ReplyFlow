"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Trash2, Edit2, Check, X, Loader2, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Template {
  id:         string;
  title:      string;
  content:    string;
  niche:      string | null;
  min_rating: number;
  max_rating: number;
}

const NICHES = [
  { value: "",           label: "Todos os nichos" },
  { value: "restaurante", label: "Restaurante" },
  { value: "clinica",    label: "Clínica / Saúde" },
  { value: "academia",   label: "Academia" },
  { value: "salão",      label: "Salão / Beleza" },
  { value: "hotel",      label: "Hotel / Hospedagem" },
  { value: "outro",      label: "Outro" },
];

const RATINGS = [
  { value: 0, label: "Qualquer avaliação" },
  { value: 5, label: "5 estrelas" },
  { value: 4, label: "4 estrelas" },
  { value: 3, label: "3 estrelas" },
  { value: 1, label: "1-2 estrelas" },
];

function ratingLabel(min: number, max: number): string {
  if (min === 1 && max === 5) return "Todas";
  if (min === max) return `${min}★`;
  return `${min}–${max}★`;
}

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title:      "",
  content:    "",
  niche:      "",
  min_rating: 1,
  max_rating: 5,
};

export function TemplatesManager({ plan }: { plan: string }) {
  const isPaid = plan !== "free";
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [showForm,  setShowForm]    = useState(false);
  const [editId,    setEditId]      = useState<string | null>(null);
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [deleting,  setDeleting]    = useState<string | null>(null);
  const [expanded,  setExpanded]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch without filters to get all custom templates
      const res  = await fetch("/api/templates/all");
      if (!res.ok) return;
      const data = await res.json();
      setTemplates(data ?? []);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditId(t.id);
    setForm({
      title:      t.title,
      content:    t.content,
      niche:      t.niche ?? "",
      min_rating: t.min_rating,
      max_rating: t.max_rating,
    });
    setShowForm(true);
    setExpanded(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  // When rating shortcut changes, map to min/max
  function handleRatingShortcut(val: number) {
    if (val === 0) setForm((f) => ({ ...f, min_rating: 1, max_rating: 5 }));
    else if (val === 1) setForm((f) => ({ ...f, min_rating: 1, max_rating: 2 }));
    else setForm((f) => ({ ...f, min_rating: val, max_rating: val }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const body = {
        title:      form.title,
        content:    form.content,
        niche:      form.niche || null,
        min_rating: form.min_rating,
        max_rating: form.max_rating,
      };

      if (editId) {
        const res = await fetch(`/api/templates/${editId}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev) => prev.map((t) => t.id === editId ? updated : t));
          cancelForm();
        }
      } else {
        const res = await fetch("/api/templates", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setTemplates((prev) => [created, ...prev]);
          cancelForm();
        }
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (editId === id) cancelForm();
    } finally { setDeleting(null); }
  }

  // Determine which rating shortcut is currently selected
  const ratingShortcut =
    form.min_rating === 1 && form.max_rating === 5 ? 0 :
    form.min_rating === 1 && form.max_rating === 2 ? 1 :
    form.min_rating === form.max_rating ? form.min_rating : 0;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Modelos de resposta personalizados
        </h2>
        <button
          type="button"
          onClick={isPaid ? openNew : undefined}
          disabled={!isPaid}
          className={cn(
            "ml-auto flex items-center gap-1 text-xs font-medium transition-colors",
            isPaid
              ? "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              : "text-gray-300 dark:text-gray-600 cursor-not-allowed",
          )}
        >
          {isPaid ? <Plus size={13} /> : <Lock size={13} />}
          Novo modelo
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Crie modelos de resposta para diferentes nichos e avaliações. Use{" "}
        <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">
          {"{authorName}"}
        </code>{" "}
        para inserir o nome do cliente automaticamente.
      </p>

      {/* Free plan upgrade prompt */}
      {!isPaid && (
        <div className="mb-4 rounded-xl border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-900/10 px-4 py-3 flex items-center gap-3">
          <Lock size={15} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300 flex-1">
            Modelos personalizados estão disponíveis nos <strong>planos pagos</strong>.
          </p>
          <Link
            href="/billing"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 underline"
          >
            Fazer upgrade
          </Link>
        </div>
      )}

      {/* Form */}
      {showForm && isPaid && (
        <div className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-900/10 p-4 space-y-3">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {editId ? "Editar modelo" : "Novo modelo"}
          </p>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do modelo
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Agradecimento 5★ Restaurante"
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Niche + Rating row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nicho
              </label>
              <select
                value={form.niche}
                onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
              >
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avaliação
              </label>
              <select
                value={ratingShortcut}
                onChange={(e) => handleRatingShortcut(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200"
              >
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Texto da resposta
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Olá, {authorName}! Obrigado pela sua avaliação…"
              rows={4}
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a35] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-[#18181f] text-gray-800 dark:text-gray-200 resize-none"
            />
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              {form.content.length} / 2000 caracteres
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editId ? "Salvar alterações" : "Criar modelo"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-gray-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-[#2a2a35] rounded-xl">
          <BookOpen size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum modelo criado ainda.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Clique em &quot;Novo modelo&quot; para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-[#2a2a35] -mx-5 px-5">
          {templates.map((t) => {
            const isExpanded = expanded === t.id;
            return (
              <div key={t.id} className="py-3 first:pt-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {t.title}
                      </p>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                        {ratingLabel(t.min_rating, t.max_rating)}
                      </span>
                      {t.niche && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium capitalize">
                          {t.niche}
                        </span>
                      )}
                    </div>

                    {/* Preview */}
                    <p
                      className={cn(
                        "text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed transition-all",
                        isExpanded ? "" : "line-clamp-2",
                      )}
                    >
                      {t.content}
                    </p>

                    {/* Expand toggle */}
                    {t.content.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : t.id)}
                        className="mt-1 flex items-center gap-0.5 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        {isExpanded
                          ? <><ChevronUp size={11} /> Recolher</>
                          : <><ChevronDown size={11} /> Ver mais</>
                        }
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {deleting === t.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
