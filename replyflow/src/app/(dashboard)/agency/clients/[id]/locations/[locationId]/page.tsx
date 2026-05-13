import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { LocationEditForm } from "@/components/locations/LocationEditForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; locationId: string }>;
}

export default async function AgencyLocationSettingsPage({ params }: PageProps) {
  const { id: clientId, locationId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();

  // Verify the user is an agency user
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const userOrg = userRecord?.organization as { plan?: string } | null;
  if (userOrg?.plan !== "agency") notFound();

  // Fetch the location
  const { data: location } = await serviceClient
    .from("locations")
    .select("*")
    .eq("id", locationId)
    .single();

  if (!location) notFound();

  // Verify the location belongs to a client of this agency
  const { data: clientOrg } = await serviceClient
    .from("organizations")
    .select("id, name")
    .eq("id", location.organization_id)
    .eq("parent_agency_id", userRecord!.organization_id)
    .single();

  if (!clientOrg) notFound();

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <Link
          href={`/agency/clients/${clientId}?tab=locations`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft size={15} />
          Voltar para {clientOrg.name}
        </Link>
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">
          Agência → {clientOrg.name}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Editar local</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atualize as configurações de <strong>{location.name}</strong>.
        </p>
      </div>

      <LocationEditForm
        location={location}
        backHref={`/agency/clients/${clientId}?tab=locations`}
      />
    </div>
  );
}
