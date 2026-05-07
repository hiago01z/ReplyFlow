"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router  = useRouter();
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [ready,     setReady]     = useState(false);

  useEffect(() => {
    // Supabase injeta o token na hash da URL após clicar no link de reset
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== password2) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError("Não foi possível redefinir a senha. O link pode ter expirado."); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Senha redefinida!</h1>
        <p className="text-sm text-gray-500">Redirecionando para o dashboard…</p>
        <div className="mt-4 flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-sm text-gray-500 mb-4">Validando link de recuperação…</p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Link inválido ou expirado?{" "}
          <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
          <Lock size={22} className="text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova senha</h1>
        <p className="text-sm text-gray-500">Escolha uma senha forte para sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nova senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          autoFocus
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Repita a senha"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Redefinir senha
        </Button>
      </form>
    </div>
  );
}
