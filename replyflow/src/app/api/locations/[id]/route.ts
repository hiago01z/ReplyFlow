import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  name:         z.string().min(2).max(100).optional(),
  niche:        z.enum(["clinica", "restaurante", "academia", "petshop", "barbearia", "outro"]).optional(),
  tone:         z.enum(["formal", "amigavel", "descontraido"]).optional(),
  auto_publish:            z.boolean().optional(),
  auto_publish_min_rating: z.number().int().min(1).max(5).optional(),
  active:                  z.boolean().optional(),
});

async function getOwnedLocation(userId: string, locationId: string) {
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();
  if (!userRecord?.organization_id) return null;

  const { data: location } = await serviceClient
    .from("locations")
    .select("id, organization_id")
    .eq("id", locationId)
    .eq("organization_id", userRecord.organization_id)
    .single();

  return location ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await getOwnedLocation(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serviceClient = createServiceClient();
  const { data: location } = await serviceClient
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  return NextResponse.json({ location });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await getOwnedLocation(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: location, error } = await serviceClient
    .from("locations")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[locations] update error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }

  return NextResponse.json({ location });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await getOwnedLocation(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: apenas desativa
  const serviceClient = createServiceClient();
  await serviceClient
    .from("locations")
    .update({ active: false })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
