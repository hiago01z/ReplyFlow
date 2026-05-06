import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user!.id)
    .single();

  const orgId = userRecord?.organization_id;

  // Buscar locais
  const { data: locations } = await serviceClient
    .from("locations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("active", true);

  const locationIds = locations?.map((l) => l.id) ?? [];

  // Métricas
  const { count: totalPending } = await serviceClient
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("location_id", locationIds)
    .eq("status", "pending");

  const { count: totalPublished } = await serviceClient
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("location_id", locationIds)
    .eq("status", "published");

  const { count: totalNegative } = await serviceClient
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("location_id", locationIds)
    .lte("rating", 2)
    .eq("status", "pending");

  const stats = [
    { label: "Reviews pendentes", value: totalPending ?? 0, color: "text-amber-600", bg: "bg-amber-50", icon: "⏳" },
    { label: "Respostas publicadas", value: totalPublished ?? 0, color: "text-green-600", bg: "bg-green-50", icon: "✅" },
    { label: "Reviews negativos", value: totalNegative ?? 0, color: "text-red-600", bg: "bg-red-50", icon: "⚠️" },
    { label: "Locais ativos", value: locationIds.length, color: "text-indigo-600", bg: "bg-indigo-50", icon: "📍" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe o desempenho da sua reputação.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {stat.icon}
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {locationIds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum local conectado
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Adicione seu primeiro local para começar a monitorar reviews.
          </p>
          <Link
            href="/locations/new"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Adicionar local →
          </Link>
        </div>
      ) : (totalPending ?? 0) > 0 ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-900">
              {totalPending} review{(totalPending ?? 0) > 1 ? "s" : ""} aguardando resposta
            </p>
            <p className="text-amber-700 text-sm mt-0.5">
              Responda agora para proteger sua reputação.
            </p>
          </div>
          <Link
            href="/reviews?status=pending"
            className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shrink-0"
          >
            Ver reviews →
          </Link>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-semibold text-green-900">Todos os reviews respondidos!</p>
          <p className="text-green-700 text-sm mt-0.5">
            Sua reputação está em dia.
          </p>
        </div>
      )}
    </div>
  );
}
