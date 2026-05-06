import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

interface LocationsPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user!.id)
    .single();

  const { data: locations } = await serviceClient
    .from("locations")
    .select("*")
    .eq("organization_id", userRecord!.organization_id)
    .order("created_at");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Locais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os locais monitorados pelo ReplyFlow.
          </p>
        </div>
        <Link
          href="/locations/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Adicionar local
        </Link>
      </div>

      {/* Feedback de sucesso/erro */}
      {params.success === "google_connected" && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800 mb-4">
          ✅ Google Meu Negócio conectado com sucesso!
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-800 mb-4">
          ⚠️ Erro ao conectar Google. Tente novamente.
        </div>
      )}

      {/* Lista de locais */}
      {!locations?.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-gray-500 mb-4">Nenhum local cadastrado ainda.</p>
          <Link
            href="/locations/new"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Adicionar primeiro local →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((loc) => {
            const isConnected = !!loc.google_access_token;
            return (
              <div
                key={loc.id}
                className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                    📍
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{loc.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {loc.niche} · Tom {loc.tone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                      ✓ Google conectado
                    </span>
                  ) : (
                    <a
                      href={`/api/google/auth?locationId=${loc.id}`}
                      className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Conectar Google →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
