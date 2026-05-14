import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { MonthlyReportButton } from "@/components/analytics/MonthlyReportButton";
import { Crown } from "lucide-react";
import Link from "next/link";

// Recharts uses browser APIs — must be loaded client-side only to avoid SSR crash
const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
  { ssr: false, loading: () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse h-[120px]">
          <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
          <div className="h-7 bg-gray-100 rounded w-16 mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      ))}
    </div>
  )},
);

export const metadata = { title: "Analytics — ReplyFlow" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization:organizations(plan, trial_ends_at)")
    .eq("id", user.id)
    .single();

  const org = userRecord?.organization as unknown as { plan: string; trial_ends_at?: string | null } | null;
  const plan = org?.plan ?? "free";
  const isPaid = plan !== "free";
  const trialActive = org?.trial_ends_at ? new Date(org.trial_ends_at).getTime() > Date.now() : false;
  const hasAccess = isPaid || trialActive;

  const canReport = plan === "pro" || plan === "agency";

  if (!hasAccess) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Analytics</p>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Reputação</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe o desempenho dos seus reviews ao longo do tempo.</p>
        </div>
        <div className="card p-10 text-center border-indigo-100">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Analytics disponível nos planos pagos</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Acesse gráficos de evolução, distribuição de notas e taxa de resposta fazendo upgrade do plano.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Crown size={14} />
            Ver planos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {canReport && <MonthlyReportButton />}
      <AnalyticsDashboard />
    </div>
  );
}
