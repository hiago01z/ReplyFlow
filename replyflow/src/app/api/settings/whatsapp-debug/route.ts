/**
 * GET /api/settings/whatsapp-debug
 * Diagnóstico: verifica se a coluna whatsapp existe e qual valor está salvo no DB.
 * Remover após validação.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  // Tenta selecionar a coluna whatsapp diretamente
  const { data, error } = await serviceClient
    .from("users")
    .select("id, whatsapp")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    userId:          user.id,
    columnExists:    !error,
    dbError:         error?.message ?? null,
    whatsappInDb:    data?.whatsapp ?? null,
  });
}
