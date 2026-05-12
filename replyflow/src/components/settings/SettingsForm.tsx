"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Building2, User, Mail, Smartphone, Bell, BellOff, Webhook, Eye, EyeOff, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface SettingsFormProps {
  organization: {
    id: string;
    name: string;
    plan: string;
    alert_email: string | null;
    webhook_url: string | null;
    webhook_secret: string | null;
  };
  user: { id: string; name: string | null; email: string; whatsapp: string | null; emailAlerts: boolean };
}

export function SettingsForm({ organization, user }: SettingsFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [orgName,        setOrgName]        = useState(organization.name);
  const [alertEmail,     setAlertEmail]     = useState(organization.alert_email ?? "");
  const [userName,       setUserName]       = useState(user.name ?? "");
  const [whatsapp,       setWhatsapp]       = useState(user.whatsapp ?? "");
  const [emailAlerts,    setEmailAlerts]    = useState(user.emailAlerts);
  const [webhookUrl,     setWebhookUrl]     = useState(organization.webhook_url ?? "");
  const [webhookSecret,  setWebhookSecret]  = useState(organization.webhook_secret ?? "");
  const [showSecret,     setShowSecret]     = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult,     setTestResult]     = useState<"ok" | "error" | null>(null);
  const [testingAlert,   setTestingAlert]   = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [saving,         setSaving]         = useState(false);

  const isPro = organization.plan === "pro" || organization.plan === "agency";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          alertEmail: alertEmail.trim() || null,
          userName,
          whatsapp: whatsapp || null,
          emailAlerts,
          webhookUrl: webhookUrl.trim() || null,
          webhookSecret: webhookSecret.trim() || null,
        }),
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

  async function sendTestAlert() {
    setTestingAlert(true);
    try {
      const res = await fetch("/api/settings/alert-test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success("Email de teste enviado!", `Verifique a caixa de entrada de ${data.sentTo ?? "seu email"}.`);
      } else {
        toastError("Erro ao enviar", data.error ?? "Tente novamente.");
      }
    } catch {
      toastError("Erro de rede", "Não foi possível enviar o email de teste.");
    } finally {
      setTestingAlert(false);
    }
  }

  async function sendTestWhatsApp() {
    setTestingWhatsApp(true);
    try {
      const res  = await fetch("/api/settings/whatsapp-test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        success("WhatsApp de teste enviado!", `Mensagem enviada para ${data.phone} via ${data.provider}.`);
      } else if (data.error === "provider_not_configured") {
        toastError("Provider não configurado", "Adicione ZAPI_INSTANCE_ID + ZAPI_TOKEN nas env vars da Vercel.");
      } else if (data.error === "no_phone") {
        toastError("Número não cadastrado", "Salve um número WhatsApp nas configurações primeiro.");
      } else {
        toastError("Erro ao enviar", data.message ?? data.error ?? "Tente novamente.");
      }
    } catch {
      toastError("Erro de rede", "Não foi possível enviar o teste WhatsApp.");
    } finally {
      setTestingWhatsApp(false);
    }
  }

  async function testWebhook() {
    if (!webhookUrl.trim()) return;
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          webhookSecret: webhookSecret.trim() || null,
        }),
      });
      if (res.ok) {
        setTestResult("ok");
        success("Webhook testado!", "Payload de teste enviado com sucesso.");
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult("error");
        toastError("Falha no webhook", data.error ?? "Não foi possível alcançar a URL.");
      }
    } catch {
      setTestResult("error");
      toastError("Erro de rede", "Verifique a URL e tente novamente.");
    } finally {
      setTestingWebhook(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {/* Empresa */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Empresa</h2>
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

      {/* Alertas */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Alertas de reviews negativos</h2>
        </div>
        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Alertas por e-mail</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Receba um e-mail quando um review de 1-2 estrelas chegar.</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                emailAlerts ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
              aria-checked={emailAlerts}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  emailAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Custom alert email */}
          {emailAlerts && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-gray-400 dark:text-gray-500" />
                E-mail de destino dos alertas
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder={user.email + " (padrão)"}
                className="w-full h-10 px-3.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Deixe em branco para usar <span className="font-medium">{user.email}</span>
              </p>
            </div>
          )}

          {emailAlerts && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={sendTestAlert}
                loading={testingAlert}
              >
                <Send size={13} className="mr-1.5" />
                Enviar email de teste
              </Button>
              <p className="text-xs text-gray-400 dark:text-gray-500">Envia um alerta de exemplo para o email acima.</p>
            </div>
          )}

          {!emailAlerts && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <BellOff size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Alertas por e-mail desativados. Você não será notificado sobre reviews negativos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Perfil */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Perfil</h2>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400 dark:text-gray-500" />
              E-mail de login
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full h-10 px-3.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#2a2a35] rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">O e-mail de login não pode ser alterado por aqui.</p>
          </div>

          {/* WhatsApp — alertas Pro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Smartphone size={13} className="text-gray-400 dark:text-gray-500" />
              WhatsApp para alertas
              {!isPro && (
                <span className="ml-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
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
                  ? "text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border-gray-200 dark:border-[#2a2a35] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 outline-none"
                  : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-[#2a2a35] text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
            />
            {isPro && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Formato: código do país + DDD + número. Ex: 5511999999999
                </p>
                {whatsapp && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={testingWhatsApp}
                    onClick={sendTestWhatsApp}
                    className="shrink-0 text-xs"
                  >
                    <Send size={12} className="mr-1" />
                    Testar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook personalizado — Pro/Agency */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Webhook size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Webhook de notificação
          </h2>
          {!isPro && (
            <span className="ml-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Receba uma requisição POST quando um review negativo (1-2 ★) chegar. Compatível com Zapier, Make e n8n.
        </p>

        {!isPro ? (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <Webhook size={14} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Faça upgrade para o plano Pro para usar webhooks personalizados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                URL do endpoint
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => { setWebhookUrl(e.target.value); setTestResult(null); }}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full h-10 px-3.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Segredo HMAC <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Chave secreta para verificar autenticidade"
                  className="w-full h-10 pl-3.5 pr-10 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Se definido, incluímos o header <code className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded">X-ReplyFlow-Signature: sha256=&lt;hmac&gt;</code> para verificar autenticidade.
              </p>
            </div>

            {/* Botão de teste */}
            {webhookUrl.trim() && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testWebhook}
                  loading={testingWebhook}
                >
                  Enviar teste
                </Button>
                {testResult === "ok" && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 size={13} /> Recebido com sucesso
                  </span>
                )}
                {testResult === "error" && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                    <AlertCircle size={13} /> Falha ao enviar
                  </span>
                )}
              </div>
            )}

            {/* Exemplo de payload */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 select-none">
                Ver exemplo de payload
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 overflow-x-auto leading-relaxed">{`{
  "event": "review.negative",
  "review_id": "uuid-do-review",
  "location_id": "uuid-do-local",
  "business_name": "Nome do Negócio",
  "author_name": "Nome do Cliente",
  "rating": 2,
  "content": "Texto do review...",
  "platform": "google",
  "review_url": "https://replyflow-hivi.com/reviews?highlight=uuid",
  "timestamp": "2026-05-11T12:00:00.000Z"
}`}</pre>
            </details>
          </div>
        )}
      </div>

      <Button type="submit" loading={saving}>
        Salvar alterações
      </Button>
    </form>
  );
}