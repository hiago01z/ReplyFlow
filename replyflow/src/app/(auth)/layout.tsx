import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex">
      {/* ── Brand panel (left) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] brand-gradient flex-col p-10 relative overflow-hidden shrink-0">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ReplyFlow</span>
        </Link>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center relative z-10 mt-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full w-fit mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Responda reviews em segundos
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Sua reputação no<br />
            <span className="text-indigo-200">piloto automático</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            IA personalizada que responde cada review no tom certo — sem você precisar fazer nada.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {[
              { icon: "⚡", text: "Respostas geradas em menos de 10 segundos" },
              { icon: "🎯", text: "Tom personalizado para o seu nicho" },
              { icon: "📈", text: "Nota no Google aumenta em média 0,4★ em 60 dias" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex gap-0.5 mb-3">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-amber-300 text-sm">{s}</span>
            ))}
          </div>
          <p className="text-white/85 text-sm leading-relaxed mb-3">
            &ldquo;Economizo 6 horas por semana. Minha nota subiu de 4,1 para 4,7 em 2 meses.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              CM
            </div>
            <div>
              <p className="text-white text-xs font-medium">Carla Mendes</p>
              <p className="text-white/50 text-xs">Clínica VitaSkin · SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form panel (right) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#f5f5fa]">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden mb-10 text-xl font-bold text-indigo-600">
          ⚡ ReplyFlow
        </Link>
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
