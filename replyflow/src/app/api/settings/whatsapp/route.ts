/**
 * PATCH /api/settings/whatsapp
 * Salva o número WhatsApp do usuário logado.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  whatsapp: z.string().min(8).max(20).nullable(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Número inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("users")
    .update({ whatsapp: parsed.data.whatsapp })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, whatsapp: parsed.data.whatsapp });
}
