"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError("Não foi possível enviar o e-mail. Verifique o endereço."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">E-mail enviado!</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Enviamos as instruções para <span className="font-medium text-gray-700">{email}</span>.
          <br />Verifique sua caixa de entrada e clique no link para redefinir a senha.
        </p>
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft size={14} />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
          <Mail size={22} className="text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Esqueceu a senha?</h1>
        <p className="text-sm text-gray-500">
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="seu@email.com"
          autoFocus
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Enviar link de recuperação
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={14} />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
