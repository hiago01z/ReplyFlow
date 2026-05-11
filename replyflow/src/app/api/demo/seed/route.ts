import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Usa os nomes de colunas reais do schema (external_id, content, platform_published_at)
const DEMO_REVIEWS = [
  {
    external_id: "demo_001",
    platform: "google" as const,
    author_name: "Maria Silva",
    rating: 5,
    content: "Atendimento excelente! Voltarei com certeza. Equipe muito atenciosa e prestativa.",
    platform_published_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    status: "pending" as const,
    published_response: null,
  },
  {
    external_id: "demo_002",
    platform: "google" as const,
    author_name: "João Pereira",
    rating: 2,
    content: "Esperei mais de uma hora sem ser atendido. Atendimento ruim, não voltarei.",
    platform_published_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: "pending" as const,
    published_response: null,
  },
  {
    external_id: "demo_003",
    platform: "google" as const,
    author_name: "Ana Costa",
    rating: 4,
    content: "Muito bom de forma geral. Apenas o estacionamento é um pouco limitado, mas o serviço compensa.",
    platform_published_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    status: "pending" as const,
    published_response: null,
  },
  {
    external_id: "demo_004",
    platform: "google" as const,
    author_name: "Carlos Mendes",
    rating: 5,
    content: "Melhor lugar da cidade! Recomendo a todos os amigos. Qualidade impecável.",
    platform_published_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: "published" as const,
    published_response: "Obrigado pelo seu carinho, Carlos! Fico muito feliz em saber que sua experiência foi tão positiva. Sua recomendação significa muito para nós. Esperamos vê-lo em breve!",
  },
  {
    external_id: "demo_005",
    platform: "google" as const,
    author_name: "Fernanda Lima",
    rating: 3,
    content: "Serviço razoável. Poderia melhorar a comunicação com os clientes sobre prazos.",
    platform_published_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    status: "pending" as const,
    published_response: null,
  },
  {
    external_id: "demo_006",
    platform: "google" as const,
    author_name: "Roberto Alves",
    rating: 5,
    content: "Incrível! Superou todas as minhas expectativas. Profissionais excelentes.",
    platform_published_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    status: "published" as const,
    published_response: "Roberto, muito obrigado pelo seu elogio! É gratificante saber que superamos suas expectativas. Continuaremos trabalhando com dedicação para sempre oferecer o melhor. Até a próxima!",
  },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users").select("organization_id").eq("id", user.id).single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const orgPrefix = userRecord.organization_id.slice(0, 8); // prefixo único por org

  const { data: location } = await serviceClient
    .from("locations").select("id")
    .eq("organization_id", userRecord.organization_id)
    .order("created_at").limit(1).single();

  if (!location) {
    return NextResponse.json({ error: "No location found. Complete onboarding first." }, { status: 400 });
  }

  // Verificar se já existe para esta org
  const { count } = await serviceClient
    .from("reviews").select("id", { count: "exact", head: true })
    .eq("location_id", location.id)
    .like("external_id", `demo_${orgPrefix}_%`);

  if ((count ?? 0) > 0) {
    // Já existem — retornar como sucesso para o cliente não mostrar erro
    return NextResponse.json({ success: true, inserted: 0, alreadyExisted: true, count });
  }

  // Inserir reviews com external_id único por organização
  for (const r of DEMO_REVIEWS) {
    const { published_response, ...reviewData } = r;
    const uniqueReviewData = {
      ...reviewData,
      external_id: reviewData.external_id.replace("demo_", `demo_${orgPrefix}_`),
    };

    const { data: inserted, error: reviewErr } = await serviceClient
      .from("reviews")
      .insert({ ...uniqueReviewData, location_id: location.id })
      .select("id")
      .single();

    if (reviewErr || !inserted) {
      console.error("[demo/seed] review insert error:", reviewErr);
      return NextResponse.json({ error: reviewErr?.message ?? "Insert failed" }, { status: 500 });
    }

    // Para reviews publicados, criar também o registro de response
    if (published_response) {
      const { error: respErr } = await serviceClient.from("responses").insert({
        review_id: inserted.id,
        content: published_response,
        ai_model: "demo",
        published_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      });
      if (respErr) {
        console.error("[demo/seed] response insert error:", respErr);
      }
    }
  }

  return NextResponse.json({ success: true, inserted: DEMO_REVIEWS.length });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users").select("organization_id").eq("id", user.id).single();
  if (!userRecord?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Busca TODOS os locais da org (não só o primeiro)
  const { data: locations } = await serviceClient
    .from("locations")
    .select("id")
    .eq("organization_id", userRecord.organization_id);

  const locationIds = (locations ?? []).map((l) => l.id);
  if (locationIds.length === 0) return NextResponse.json({ error: "No locations" }, { status: 400 });

  // Deleta todos os reviews de demo em qualquer local da org
  const { error: deleteError, count } = await serviceClient
    .from("reviews")
    .delete({ count: "exact" })
    .in("location_id", locationIds)
    .like("external_id", "demo%");

  if (deleteError) {
    console.error("[demo/seed DELETE] error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: count ?? 0 });
}
