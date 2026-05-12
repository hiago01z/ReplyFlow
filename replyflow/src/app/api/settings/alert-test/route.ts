/**
 * POST /api/settings/alert-test
 * Envia um email de alerta de review negativo de teste para o email do usuário logado.
 * Usado apenas para validar que o Resend está funcionando em produção.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendNegativeReviewAlert } from "@/lib/email/alerts";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("email, organization:organizations(name)")
    .eq("id", user.id)
    .single();

  const email = userRecord?.email ?? user.email;
  if (!email) return NextResponse.json({ error: "No email found" }, { status: 400 });

  const org = userRecord?.organization as unknown as { name: string } | null;

  const result = await sendNegativeReviewAlert({
    to:           email,
    businessName: org?.name ?? "Meu Negócio (Teste)",
    authorName:   "Cliente Teste",
    rating:       1,
    content:      "Este é um email de teste do ReplyFlow. Se você está vendo isso, os alertas estão funcionando corretamente!",
    reviewId:     "00000000-0000-0000-0000-000000000000",
  });

  // Expõe o erro do Resend para diagnóstico
  if (result?.error) {
    console.error("[alert-test] Resend error:", result.error);
    return NextResponse.json(
      { error: `Resend: ${(result.error as { message?: string }).message ?? JSON.stringify(result.error)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, sentTo: email, resendId: result?.data?.id });
}
