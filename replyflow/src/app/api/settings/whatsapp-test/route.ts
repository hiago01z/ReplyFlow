/**
 * POST /api/settings/whatsapp-test
 * Envia uma mensagem de teste no WhatsApp do usuário logado.
 * Valida provider configurado e número salvo em settings.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppAlert } from "@/lib/email/alerts";

function detectProvider() {
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN)           return "zapi";
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)   return "evolution";
  return "none";
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = detectProvider();
  if (provider === "none") {
    return NextResponse.json({
      error:    "provider_not_configured",
      message:  "Nenhum provider WhatsApp configurado. Adicione ZAPI_INSTANCE_ID + ZAPI_TOKEN (ou EVOLUTION_API_URL + EVOLUTION_API_KEY) nas variáveis de ambiente da Vercel.",
      provider: "none",
    }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("whatsapp, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const phone = userRecord?.whatsapp;
  if (!phone) {
    return NextResponse.json({
      error:   "no_phone",
      message: "Nenhum número WhatsApp cadastrado. Adicione em Configurações → WhatsApp para alertas.",
    }, { status: 400 });
  }

  const plan = (userRecord?.organization as { plan?: string } | null)?.plan ?? "free";
  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json({
      error:   "plan_required",
      message: "Alertas WhatsApp estão disponíveis nos planos Pro e Agency.",
    }, { status: 403 });
  }

  try {
    await sendWhatsAppAlert({
      phone,
      businessName: "Meu Negócio (Teste)",
      authorName:   "Cliente Teste",
      rating:       1,
      content:      "Este é um teste do ReplyFlow. Se você recebeu esta mensagem, os alertas WhatsApp estão funcionando!",
      reviewId:     "00000000-0000-0000-0000-000000000000",
    });

    return NextResponse.json({ success: true, phone, provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, provider }, { status: 500 });
  }
}
