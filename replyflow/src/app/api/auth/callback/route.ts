import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/alerts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const serviceClient = createServiceClient();

      // Verificar se o usuário já tem registro na tabela users
      const { data: existingUser } = await serviceClient
        .from("users")
        .select("id, organization_id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        // Novo usuário via OAuth — criar organização e usuário
        const { data: org } = await serviceClient
          .from("organizations")
          .insert({ name: data.user.user_metadata?.name ?? "Minha Empresa" })
          .select()
          .single();

        if (org) {
          await serviceClient.from("users").insert({
            id: data.user.id,
            organization_id: org.id,
            name: data.user.user_metadata?.name ?? null,
            email: data.user.email,
          });

          // Enviar e-mail de boas-vindas (não bloquear se falhar)
          if (data.user.email) {
            await sendWelcomeEmail({
              to: data.user.email,
              name: data.user.user_metadata?.name ?? data.user.email,
            }).catch(() => null);
          }
        }

        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Usuário existente sem organização configurada
      if (!existingUser.organization_id) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
