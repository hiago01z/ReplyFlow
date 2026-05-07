import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Plus, CheckCircle2, Wifi, Settings2 } from "lucide-react";

interface LocationsPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users").select("organization_id").eq("id", user!.id).single();

  const { data: locations } = await serviceClient
    .from("locations").select("*")
    .eq("organization_id", userRecord!.organization_id)
    .order("created_at");

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Locais</p>
          <h1 className="text-2xl font-bold text-gray-900">Meus Locais</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os locais monitorados pelo ReplyFlow.</p>
        </div>
        <Link
          href="/locations/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Adicionar local
        </Link>
      </div>

      {/* Toast feedback */}
      {params.success === "google_connected" && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 mb-5">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          Google Meu Negócio conectado! Local detectado automaticamente.
        </div>
      )}
      {params.success === "google_connected_no_location" && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>
            Google conectado, mas não foi possível detectar o local automaticamente.
            Tente desconectar e reconectar, ou verifique se sua conta Google tem acesso ao Google Meu Negócio.
          </span>
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 mb-5">
          <span className="shrink-0">⚠️</span>
          Erro ao conectar Google. Tente novamente.
        </div>
      )}

      {/* Empty state */}
      {!locations?.length ? (
        <div className="card border-dashed p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhum local cadastrado</h3>
          <p className="text-sm text-gray-500 mb-6">Adicione seu primeiro local para começar a monitorar reviews.</p>
          <Link
            href="/locations/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Adicionar primeiro local
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const isConnected = !!loc.google_access_token;
            return (
              <div key={loc.id} className="card px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{loc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {loc.niche} · Tom: {loc.tone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {isConnected && loc.google_location_name ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                      <Wifi size={12} />
                      Google conectado
                    </div>
                  ) : isConnected && !loc.google_location_name ? (
                    <a
                      href={`/api/google/auth?locationId=${loc.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                      title="Local GMB não detectado — reconectar"
                    >
                      <Wifi size={12} />
                      Reconectar Google
                    </a>
                  ) : (
                    <a
                      href={`/api/google/auth?locationId=${loc.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Plus size={12} />
                      Conectar Google
                    </a>
                  )}
                  <Link
                    href={`/locations/${loc.id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Editar local"
                  >
                    <Settings2 size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      {(locations?.length ?? 0) > 0 && (
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-indigo-600 text-[10px] font-bold">i</span>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Após conectar o Google, o ReplyFlow busca reviews automaticamente a cada 30 minutos.
            Você também pode forçar uma busca manual acessando as configurações do local.
          </p>
        </div>
      )}
    </div>
  );
}
