"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  organization: {
    id: string;
    name: string;
    plan: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function SettingsForm({ organization, user }: SettingsFormProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(organization.name);
  const [userName, setUserName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, userName }),
      });

      if (!res.ok) throw new Error("Falha ao salvar configurações.");

      setSaved(true);
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ Configurações salvas com sucesso.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dados da empresa */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Empresa</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome da empresa
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            required
            minLength={2}
          />
        </div>
      </div>

      {/* Dados do perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seu nome
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado por aqui.</p>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
