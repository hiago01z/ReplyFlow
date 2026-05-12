/**
 * GET /api/settings/whatsapp-debug
 * Diagnóstico: verifica coluna, tenta UPDATE de teste e retorna resultado completo.
 * Remover após validação.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  // 1. Leitura atual
  const { data: readData, error: readError } = await serviceClient
    .from("users")
    .select("id, whatsapp")
    .eq("id", user.id)
    .single();

  // 2. UPDATE de teste com valor "DEBUG_TEST"
  const { error: updateError, count } = await serviceClient
    .from("users")
    .update({ whatsapp: "DEBUG_TEST" })
    .eq("id", user.id);

  // 3. Leitura após update
  const { data: afterData } = await serviceClient
    .from("users")
    .select("id, whatsapp")
    .eq("id", user.id)
    .single();

  // 4. Limpa o valor de teste
  await serviceClient
    .from("users")
    .update({ whatsapp: readData?.whatsapp ?? null })
    .eq("id", user.id);

  return NextResponse.json({
    userId:           user.id,
    readError:        readError?.message ?? null,
    whatsappBefore:   readData?.whatsapp ?? null,
    updateError:      updateError?.message ?? null,
    rowsAffected:     count,
    whatsappAfter:    afterData?.whatsapp ?? null,
    updateWorked:     afterData?.whatsapp === "DEBUG_TEST",
  });
}
