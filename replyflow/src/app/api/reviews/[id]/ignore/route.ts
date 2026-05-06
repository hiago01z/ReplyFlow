import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  // Verificar acesso
  const { data: review } = await serviceClient
    .from("reviews")
    .select("location_id, locations(organization_id)")
    .eq("id", id)
    .single();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const reviewOrgId = (review?.locations as { organization_id: string } | null)?.organization_id;

  if (!review || reviewOrgId !== userRecord?.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await serviceClient.from("reviews").update({ status: "ignored" }).eq("id", id);

  return NextResponse.json({ success: true });
}
