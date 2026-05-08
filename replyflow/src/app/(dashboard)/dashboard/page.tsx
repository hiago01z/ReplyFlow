import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Clock, CheckCircle2, AlertTriangle, MapPin, ArrowRight, Star, Sparkles, BarChart2 } from "lucide-react";
import { DemoSeedButton } from "@/components/dashboard/DemoSeedButton";
import { WeeklySparkline } from "@/components/dashboard/WeeklySparkline";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(name)")
    .eq("id", user!.id)
    .single();

  const orgId = userRecord?.organization_id;

  const { data: locations } = await serviceClient
    .from("locations")
    .select("id, auto_publish, google_access_token")
    .eq("organization_id", orgId)
    .eq("active", true);

  const locationIds = locations?.map((l) => l.id) ?? [];
  const autoPublishCount = (locations ?? []).filter((l) => l.auto_publish).length;

  // Onboarding checklist state
  const hasGoogleConnected = (locations ?? []).some((l) => !!l.google_access_token);
  const hasAutoPublish     = autoPublishCount > 0;

  const [{ count: totalPending }, { count: totalPublished }, { count: totalNegative }, { count: totalTotal }] =
    await Promise.all([
      serviceClient.from("reviews").select("id", { count: "exact", head: true }).in("location_id", locationIds).eq("status", "pending"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true }).in("location_id", locationIds).eq("status", "published"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true }).in("location_id", locationIds).lte("rating", 2).eq("status", "pending"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true }).in("location_id", locationIds),
    ]);

  const replyRate = totalTotal && totalTotal > 0
    ? Math.round(((totalPublished ?? 0) / totalTotal) * 100)
    : 0;

  // ── Sparkline: últimos 7 + 7 dias para tendência ─────────────────────────
  const now = new Date();
  const day14Ago = new Date(now); day14Ago.setDate(now.getDate() - 14);
  const day7Ago  = new Date(now); day7Ago.setDate(now.getDate() - 7);

  const { data: sparkRows } = locationIds.length > 0
    ? await serviceClient
        .from("reviews")
        .select("created_at")
        .in("location_id", locationIds)
        .gte("created_at", day14Ago.toISOString())
    : { data: [] as { created_at: string }[] };

  // Build daily buckets for last 7 days
  const weekBuckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    weekBuckets[d.toISOString().slice(0, 10)] = 0;
  }

  let weekTotal = 0;
  let prevWeekTotal = 0;
  for (const row of sparkRows ?? []) {
    const key = row.created_at.slice(0, 10);
    const d = new Date(key + "T00:00:00");
    if (d >= day7Ago) {
      weekBuckets[key] = (weekBuckets[key] ?? 0) + 1;
      weekTotal++;
    } else {
      prevWeekTotal++;
    }
  }

  const sparkData = Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      label: new Date(key + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total,
    }));

  const sparkTrend = prevWeekTotal === 0
    ? (weekTotal > 0 ? 100 : 0)
    : Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100);

  // Check if user generated at least one AI response (onboarding step)
  let hasFirstResponse = false;
  if (locationIds.length > 0) {
    const { count: responseCount } = await serviceClient
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("location_id", locationIds)
      .in("status", ["draft", "published"]);
    hasFirstResponse = (responseCount ?? 0) > 0;
  }

  // Detectar se há reviews de demo carregados
  const { count: demoCount } = locationIds.length > 0
    ? await serviceClient
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .in("location_id", locationIds)
        .like("external_id", "demo_%")
    : { count: 0 };
  const hasDemo = (demoCount ?? 0) > 0;

  const orgName = (userRecord?.organization as unknown as { name: string } | null)?.name ?? "sua empresa";

  const stats = [
    {
      label: "Pendentes",
      value: totalPending ?? 0,
      Icon: Clock,
      iconCls: "text-amber-500",
      bgCls:   "bg-amber-50",
      valueCls:"text-amber-600",
      href: "/reviews?status=pending",
    },
    {
      label: "Publicados",
      value: totalPublished ?? 0,
      Icon: CheckCircle2,
      iconCls: "text-green-500",
      bgCls:   "bg-green-50",
      valueCls:"text-green-600",
      href: "/reviews?status=published",
    },
    {
      label: "Críticos",
      value: totalNegative ?? 0,
      Icon: AlertTriangle,
      iconCls: "text-red-500",
      bgCls:   "bg-red-50",
      valueCls:"text-red-600",
      href: "/reviews?rating=1",
    },
    {
      label: "Locais ativos",
      value: locationIds.length,
      Icon: MapPin,
      iconCls: "text-indigo-500",
      bgCls:   "bg-indigo-50",
      valueCls:"text-indigo-600",
      href: "/locations",
    },
  ];

  // Show onboarding checklist only while not fully set up
  const showOnboarding = !hasGoogleConnected || !hasFirstResponse;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Visão Geral</p>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá 👋 — bem-vindo ao painel de <span className="text-indigo-600">{orgName}</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe sua reputação em tempo real.</p>
      </div>

      {/* Onboarding checklist */}
      {showOnboarding && (
        <OnboardingChecklist
          hasGoogleConnected={hasGoogleConnected}
          hasFirstResponse={hasFirstResponse}
          hasAutoPublish={hasAutoPublish}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 ${s.bgCls} rounded-xl flex items-center justify-center`}>
              <s.Icon size={18} className={s.iconCls} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${s.valueCls} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Weekly sparkline */}
      {locationIds.length > 0 && (
        <div className="mb-6">
          <WeeklySparkline data={sparkData} weekTotal={weekTotal} trend={sparkTrend} />
        </div>
      )}

      {/* Reply rate banner */}
      {totalTotal !== null && totalTotal > 0 && (
        <div className="card p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Star size={20} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Taxa de resposta</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalPublished ?? 0} de {totalTotal} reviews respondidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{replyRate}%</div>
            </div>
            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${replyRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Auto-publish banner */}
      {autoPublishCount > 0 && (
        <div className="card p-4 flex items-center gap-3 border-indigo-100 bg-indigo-50/60 mb-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900">
              Auto-resposta ativa em {autoPublishCount} {autoPublishCount === 1 ? "local" : "locais"}
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              A IA está respondendo reviews automaticamente a cada 30 minutos.
            </p>
          </div>
          <Link
            href="/locations"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
          >
            Gerenciar
          </Link>
        </div>
      )}

      {/* Analytics shortcut — aparece quando há reviews */}
      {(totalTotal ?? 0) > 0 && (
        <Link
          href="/analytics"
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group mb-2"
        >
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
            <BarChart2 size={15} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Ver relatório completo</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Gráficos de tendência, distribuição de estrelas e taxa de resposta.
            </p>
          </div>
          <ArrowRight size={15} className="text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
        </Link>
      )}

      {/* Demo banner — carregar quando não há reviews, remover quando há demo */}
      {locationIds.length > 0 && (totalTotal === 0 || totalTotal === null) && (
        <DemoSeedButton />
      )}
      {locationIds.length > 0 && (totalTotal ?? 0) > 0 && hasDemo && (
        <DemoSeedButton hasDemo />
      )}

      {/* CTA card */}
      {locationIds.length === 0 ? (
        <div className="card border-dashed p-10 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhum local conectado</h3>
          <p className="text-sm text-gray-500 mb-6">
            Adicione seu primeiro local para começar a monitorar reviews.
          </p>
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Adicionar local <ArrowRight size={15} />
          </Link>
        </div>
      ) : (totalPending ?? 0) > 0 ? (
        <div className="card p-5 flex items-center justify-between gap-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {totalPending} review{(totalPending ?? 0) > 1 ? "s" : ""} aguardando resposta
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Responda agora para proteger sua reputação.</p>
            </div>
          </div>
          <Link
            href="/reviews?status=pending"
            className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shrink-0"
          >
            Ver reviews <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Tudo em dia! 🎉</p>
            <p className="text-sm text-gray-500 mt-0.5">Todos os reviews foram respondidos. Sua reputação está protegida.</p>
          </div>
        </div>
      )}
    </div>
  );
}
