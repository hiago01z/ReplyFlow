import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { LocationEditForm } from "@/components/locations/LocationEditForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LocationEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationEditPage({ params }: LocationEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();

  // Verificar que o local pertence à org do usuário
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) redirect("/onboarding");

  const { data: location } = await serviceClient
    .from("locations")
    .select("*")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .single();

  if (!location) notFound();

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <Link
          href="/locations"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft size={15} />
          Voltar para Locais
        </Link>
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Locais</p>
        <h1 className="text-2xl font-bold text-gray-900">Editar local</h1>
        <p className="text-sm text-gray-500 mt-1">Atualize as configurações de <strong>{location.name}</strong>.</p>
      </div>

      <LocationEditForm location={location} />
    </div>
  );
}
