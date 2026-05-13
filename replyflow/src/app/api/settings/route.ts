import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  orgName:       z.string().min(2).max(100).optional(),
  alertEmail:    z.string().email().max(200).optional().nullable(),
  userName:      z.string().max(100).optional(),
  whatsapp:      z.string().max(20).optional().nullable(),
  emailAlerts:   z.boolean().optional(),
  webhookUrl:    z.string().url().max(500).optional().nullable(),
  webhookSecret: z.string().max(200).optional().nullable(),
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
    console.error("[settings PATCH] validation error:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Dados inválidos", detail: parsed.error.flatten() },
      { status: 400 }
    );
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

  const orgUpdate: Record<string, unknown> = {};
  if (parsed.data.orgName       !== undefined) orgUpdate.name           = parsed.data.orgName;
  if (parsed.data.alertEmail    !== undefined) orgUpdate.alert_email    = parsed.data.alertEmail;
  if (parsed.data.webhookUrl    !== undefined) orgUpdate.webhook_url    = parsed.data.webhookUrl;
  if (parsed.data.webhookSecret !== undefined) orgUpdate.webhook_secret = parsed.data.webhookSecret;

  if (Object.keys(orgUpdate).length > 0) {
    updates.push(
      serviceClient
        .from("organizations")
        .update(orgUpdate)
        .eq("id", userRecord.organization_id)
    );
  }

  const userUpdate: Record<string, unknown> = {};
  if (parsed.data.userName    !== undefined) userUpdate.name         = parsed.data.userName;
  if (parsed.data.whatsapp    !== undefined) userUpdate.whatsapp     = parsed.data.whatsapp;
  if (parsed.data.emailAlerts !== undefined) userUpdate.email_alerts = parsed.data.emailAlerts;

  if (Object.keys(userUpdate).length > 0) {
    updates.push(
      serviceClient.from("users").update(userUpdate).eq("id", user.id)
    );
  }

  console.log("[settings PATCH] orgUpdate:", JSON.stringify(orgUpdate));
  console.log("[settings PATCH] userUpdate:", JSON.stringify(userUpdate));

  const results = await Promise.all(updates);

  // Surface any DB errors instead of silently swallowing them
  for (const result of results) {
    const r = result as { error?: { message?: string; code?: string; details?: string } } | null;
    if (r && r.error) {
      console.error("[settings PATCH] DB error:", r.error.code, r.error.message, r.error.details);
      return NextResponse.json(
        { error: r.error.message ?? "Erro no banco de dados", code: r.error.code },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
