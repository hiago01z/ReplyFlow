import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  orgName:   z.string().min(2).max(100).optional(),
  userName:  z.string().max(100).optional(),
  whatsapp:  z.string().max(20).optional().nullable(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: PromiseLike<unknown>[] = [];

  if (parsed.data.orgName) {
    updates.push(
      serviceClient
        .from("organizations")
        .update({ name: parsed.data.orgName })
        .eq("id", userRecord.organization_id)
    );
  }

  const userUpdate: Record<string, unknown> = {};
  if (parsed.data.userName !== undefined) userUpdate.name     = parsed.data.userName;
  if (parsed.data.whatsapp  !== undefined) userUpdate.whatsapp = parsed.data.whatsapp;

  if (Object.keys(userUpdate).length > 0) {
    updates.push(
      serviceClient.from("users").update(userUpdate).eq("id", user.id)
    );
  }

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
