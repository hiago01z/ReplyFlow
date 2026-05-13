import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * DELETE /api/account
 * Exclui permanentemente a conta do usuário autenticado:
 *   - Remove todos os dados da organização (cascade via FK: locations → reviews → responses, alerts)
 *   - Remove o registro na tabela `users`
 *   - Exclui o usuário do Supabase Auth (via service role)
 * Requer confirmação no body: { confirm: "EXCLUIR MINHA CONTA" }
 */
export async function DELETE(request: Request) {
  // 1. Verificar autenticação
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Validar confirmação no body
  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (body.confirm !== "EXCLUIR MINHA CONTA") {
    return NextResponse.json({ error: "Confirmação inválida." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // 3. Buscar organization_id do usuário
  const { data: userRecord, error: userErr } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (userErr || !userRecord?.organization_id) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const orgId = userRecord.organization_id;

  // 4. Excluir organização (cascade elimina locations → reviews → responses, alerts, etc.)
  const { error: orgDeleteErr } = await serviceClient
    .from("organizations")
    .delete()
    .eq("id", orgId);

  if (orgDeleteErr) {
    console.error("[account/delete] org delete error:", orgDeleteErr);
    return NextResponse.json({ error: "Erro ao excluir dados da organização." }, { status: 500 });
  }

  // 5. Excluir usuário do Supabase Auth (service role)
  const { error: authDeleteErr } = await serviceClient.auth.admin.deleteUser(user.id);

  if (authDeleteErr) {
    console.error("[account/delete] auth delete error:", authDeleteErr);
    // Dados já removidos — retornar sucesso de qualquer forma
  }

  return NextResponse.json({ success: true });
}
