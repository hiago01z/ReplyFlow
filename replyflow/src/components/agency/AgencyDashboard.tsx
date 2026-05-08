"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Users, Clock, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOrg {
  id:        string;
  name:      string;
  plan:      string;
  locations: number;
  pending:   number;
  total:     number;
  created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free:    "Free",
  starter: "Starter",
  pro:     "Pro",
  agency:  "Agência",
};

export function AgencyDashboard() {
  const [clients,     setClients]     = useState<ClientOrg[]>([]);
  const [agencyName,  setAgencyName]  = useState("");
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [newName,     setNewName]     = useState("");
  const [adding,      setAdding]      = useState(false);
  const [addError,    setAddError]    = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/agency/clients");
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients ?? []);
        setAgencyName(data.agencyName ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleAddClient() {
    if (!newName.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res  = await fetch("/api/agency/clients", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewName("");
        setShowAdd(false);
        fetchClients();
      } else {
        setAddError(data.message ?? "Erro ao criar cliente.");
      }
    } finally {
      setAdding(false);
    }
  }

  const totalPending = clients.reduce((acc, c) => acc + c.pending, 0);
  const totalReviews = clients.reduce((acc, c) => acc + c.total,   0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Agência</p>
          <h1 className="text-2xl font-bold text-gray-900">Painel da Agência</h1>
          <p className="text-sm text-gray-500 mt-1">
            {agencyName && <span className="font-medium text-gray-700">{agencyName}</span>}
            {agencyName && " · "}
            Gerencie os clientes da sua agência.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(""); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Adicionar cliente
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clientes",          value: clients.length, icon: Building2, color: "bg-indigo-500" },
          { label: "Reviews pendentes", value: totalPending,   icon: Clock,     color: "bg-amber-500" },
          { label: "Total de reviews",  value: totalReviews,   icon: CheckCircle2, color: "bg-green-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5 flex flex-col gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", kpi.color)}>
              <kpi.icon size={16} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add client modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Novo cliente</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={15} />
              </button>
            </div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nome da empresa
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddClient()}
              placeholder="Ex: Clínica São Paulo"
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 mb-3"
              autoFocus
            />
            {addError && (
              <p className="text-xs text-red-600 mb-3">{addError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddClient}
                disabled={adding || !newName.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-[76px]" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Nenhum cliente ainda</p>
          <p className="text-xs text-gray-500">Clique em "Adicionar cliente" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="card px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 size={17} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {client.locations} local{client.locations !== 1 ? "is" : ""} · {client.total} review{client.total !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {client.pending > 0 && (
                  <span className="min-w-[22px] h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5">
                    {client.pending > 99 ? "99+" : client.pending}
                  </span>
                )}
                <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {PLAN_LABELS[client.plan] ?? client.plan}
                </span>
                <span className="text-[11px] text-gray-400">
                  desde {new Date(client.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
