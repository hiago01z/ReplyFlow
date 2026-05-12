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

/** POST /api/settings/whatsapp-debug?phone=5511999999999
 *  Simula exatamente o que o settings PATCH faz para salvar whatsapp. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? "5511999999999";

  const serviceClient = createServiceClient();

  // Passo 1: busca organization_id (igual ao settings PATCH)
  const { data: userRecord, error: userErr } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Passo 2: faz o update (igual ao settings PATCH)
  const { error: updateError, count, status } = await serviceClient
    .from("users")
    .update({ whatsapp: phone })
    .eq("id", user.id);

  // Passo 3: lê o valor após update
  const { data: afterData } = await serviceClient
    .from("users")
    .select("whatsapp")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    step1_userRecord:   userRecord ? "ok" : "null",
    step1_error:        userErr?.message ?? null,
    step2_updateError:  updateError?.message ?? null,
    step2_updateStatus: status,
    step2_count:        count,
    step3_whatsappNow:  afterData?.whatsapp ?? null,
    saved:              afterData?.whatsapp === phone,
  });
}
