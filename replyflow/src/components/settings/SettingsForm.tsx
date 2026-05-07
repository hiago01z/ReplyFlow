"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Building2, User, Mail, Smartphone } from "lucide-react";

interface SettingsFormProps {
  organization: { id: string; name: string; plan: string };
  user: { id: string; name: string | null; email: string; whatsapp: string | null };
}

export function SettingsForm({ organization, user }: SettingsFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [orgName,   setOrgName]   = useState(organization.name);
  const [userName,  setUserName]  = useState(user.name ?? "");
  const [whatsapp,  setWhatsapp]  = useState(user.whatsapp ?? "");
  const [saving,    setSaving]    = useState(false);

  const isPro = organization.plan === "pro" || organization.plan === "agency";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, userName, whatsapp: whatsapp || null }),
      });
      if (!res.ok) throw new Error();
      success("Configurações salvas!", "Suas alterações foram salvas com sucesso.");
      router.refresh();
    } catch {
      toastError("Erro ao salvar", "Ocorreu um erro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {/* Empresa */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Empresa</h2>
        </div>
        <Input
          label="Nome da empresa"
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          required
          minLength={2}
          placeholder="Ex: Clínica Sorriso Perfeito"
        />
      </div>

      {/* Perfil */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Perfil</h2>
        </div>
        <div className="space-y-4">
          <Input
            label="Seu nome"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="João Silva"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400" />
              E-mail
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-gray-400">O e-mail não pode ser alterado por aqui.</p>
          </div>

          {/* WhatsApp — alertas Pro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Smartphone size={13} className="text-gray-400" />
              WhatsApp para alertas
              {!isPro && (
                <span className="ml-1 text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              )}
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={!isPro}
              placeholder={isPro ? "5511999999999" : "Disponível no plano Pro"}
              className={`w-full h-10 px-3.5 text-sm border rounded-lg transition-colors ${
                isPro
                  ? "bg-white border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            />
            {isPro && (
              <p className="mt-1.5 text-xs text-gray-400">
                Formato: código do país + DDD + número. Ex: 5511999999999
              </p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" loading={saving}>
        Salvar alterações
      </Button>
    </form>
  );
}
