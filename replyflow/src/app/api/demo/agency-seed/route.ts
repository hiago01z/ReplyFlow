/**
 * POST /api/demo/agency-seed
 *   Creates 3 demo client organizations with locations and reviews for agency plan users.
 *   Idempotent — deletes existing demo data before re-inserting.
 *
 * DELETE /api/demo/agency-seed
 *   Removes all demo client organizations created by this seed.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const DEMO_CLIENTS = [
  {
    name: "Clínica Saúde Prime",
    location: { name: "Unidade Centro", niche: "clinica", tone: "amigavel" },
    reviews: [
      {
        external_id: "agency_demo_001",
        platform: "google" as const,
        author_name: "Mariana Oliveira",
        rating: 5,
        content: "Atendimento impecável! A equipe é muito atenciosa e profissional. Consultei com a Dra. Paula e fiquei muito satisfeita.",
        status: "pending" as const,
        days_ago: 1,
      },
      {
        external_id: "agency_demo_002",
        platform: "google" as const,
        author_name: "Ricardo Gomes",
        rating: 2,
        content: "Esperei mais de 2 horas além do horário marcado. Não recebi nenhum aviso sobre o atraso. Decepcionante.",
        status: "pending" as const,
        days_ago: 3,
      },
      {
        external_id: "agency_demo_003",
        platform: "tripadvisor" as const,
        author_name: "Ana Beatriz",
        rating: 4,
        content: "Ótima clínica, estrutura moderna e equipe simpática. Apenas o estacionamento é complicado.",
        status: "pending" as const,
        days_ago: 5,
      },
      {
        external_id: "agency_demo_004",
        platform: "reclame_aqui" as const,
        author_name: "José Carlos",
        rating: 1,
        content: "Cobrei no cartão de crédito um valor diferente do combinado. Tentei resolver por telefone mas ninguém retornou.",
        status: "pending" as const,
        days_ago: 7,
      },
    ],
  },
  {
    name: "Restaurante Sabor & Arte",
    location: { name: "Filial Jardins", niche: "restaurante", tone: "descontraido" },
    reviews: [
      {
        external_id: "agency_demo_005",
        platform: "google" as const,
        author_name: "Fernanda Lima",
        rating: 5,
        content: "Melhor restaurante da cidade! O frango grelhado é divino e o atendimento é super simpático. Já indiquei para todos os amigos!",
        status: "pending" as const,
        days_ago: 1,
      },
      {
        external_id: "agency_demo_006",
        platform: "google" as const,
        author_name: "Paulo Henrique",
        rating: 3,
        content: "Comida boa, mas o serviço estava lento no sábado à noite. Precisa reforçar a equipe nos fins de semana.",
        status: "pending" as const,
        days_ago: 4,
      },
      {
        external_id: "agency_demo_007",
        platform: "tripadvisor" as const,
        author_name: "Carla Mendes",
        rating: 5,
        content: "Ambiente lindo, cardápio variado e preço justo. O chef veio pessoalmente perguntar como estava a comida. Adorei!",
        status: "published" as const,
        days_ago: 10,
        published_response: "Oi Carla! Que alegria ler isso! 🎉 O nosso chef vai ficar super feliz em saber. Te esperamos em breve com novidades no cardápio!",
      },
    ],
  },
  {
    name: "Academia FitLife",
    location: { name: "Unidade Moema", niche: "academia", tone: "amigavel" },
    reviews: [
      {
        external_id: "agency_demo_008",
        platform: "google" as const,
        author_name: "Thiago Souza",
        rating: 5,
        content: "Academia excelente! Equipamentos novos, professores atenciosos e ambiente motivador. Melhorei muito meu condicionamento.",
        status: "pending" as const,
        days_ago: 2,
      },
      {
        external_id: "agency_demo_009",
        platform: "google" as const,
        author_name: "Juliana Castro",
        rating: 4,
        content: "Muito boa academia. Tem todas as máquinas que preciso. Só acho que poderia ter mais aulas de ginástica no turno da tarde.",
        status: "pending" as const,
        days_ago: 6,
      },
      {
        external_id: "agency_demo_010",
        platform: "reclame_aqui" as const,
        author_name: "Bruno Alves",
        rating: 2,
        content: "Tentei cancelar meu plano há 30 dias e até hoje não consegui. Continuam cobrando. Péssimo atendimento no financeiro.",
        status: "pending" as const,
        days_ago: 8,
      },
    ],
  },
];

const DEMO_ORG_PREFIX = "agency_demo_";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const userOrg = userRecord?.organization as { plan?: string } | null;
  if (userOrg?.plan !== "agency") {
    return NextResponse.json({ error: "Plano Agência necessário." }, { status: 403 });
  }

  const agencyOrgId = userRecord!.organization_id;
  const orgPrefix   = agencyOrgId.slice(0, 8);

  // Clean up any existing demo clients first (idempotent)
  const { data: existingDemos } = await serviceClient
    .from("organizations")
    .select("id")
    .eq("parent_agency_id", agencyOrgId)
    .like("name", `${DEMO_ORG_PREFIX}%`);

  if (existingDemos && existingDemos.length > 0) {
    const demoIds = existingDemos.map((o) => o.id);
    // Locations (and their reviews/responses cascade via DB)
    const { data: demoLocations } = await serviceClient
      .from("locations")
      .select("id")
      .in("organization_id", demoIds);
    if (demoLocations && demoLocations.length > 0) {
      await serviceClient
        .from("reviews")
        .delete()
        .in("location_id", demoLocations.map((l) => l.id));
      await serviceClient
        .from("locations")
        .delete()
        .in("organization_id", demoIds);
    }
    await serviceClient
      .from("organizations")
      .delete()
      .in("id", demoIds);
  }

  let totalInserted = 0;

  for (const client of DEMO_CLIENTS) {
    // Create client org
    const { data: clientOrg, error: orgErr } = await serviceClient
      .from("organizations")
      .insert({
        name:             `${DEMO_ORG_PREFIX}${client.name}`,
        plan:             "pro",
        parent_agency_id: agencyOrgId,
      })
      .select("id")
      .single();

    if (orgErr || !clientOrg) {
      console.error("[agency-seed] org insert error:", orgErr);
      return NextResponse.json({ error: "Falha ao criar cliente demo." }, { status: 500 });
    }

    // Create location
    const { data: location, error: locErr } = await serviceClient
      .from("locations")
      .insert({
        organization_id: clientOrg.id,
        name:            client.location.name,
        niche:           client.location.niche,
        tone:            client.location.tone,
        auto_publish:    false,
      })
      .select("id")
      .single();

    if (locErr || !location) {
      console.error("[agency-seed] location insert error:", locErr);
      return NextResponse.json({ error: "Falha ao criar local demo." }, { status: 500 });
    }

    // Create reviews
    for (const review of client.reviews) {
      const { published_response, days_ago, ...reviewData } = review as typeof review & { published_response?: string };
      const uniqueReview = {
        ...reviewData,
        external_id:          `${reviewData.external_id}_${orgPrefix}`,
        platform_published_at: new Date(Date.now() - days_ago * 24 * 3600 * 1000).toISOString(),
        location_id:           location.id,
      };

      const { data: insertedReview, error: reviewErr } = await serviceClient
        .from("reviews")
        .insert(uniqueReview)
        .select("id")
        .single();

      if (reviewErr || !insertedReview) {
        console.error("[agency-seed] review insert error:", reviewErr);
        continue;
      }

      if (published_response) {
        await serviceClient.from("responses").insert({
          review_id:    insertedReview.id,
          content:      published_response,
          ai_model:     "demo",
          published_at: new Date(Date.now() - (days_ago - 1) * 24 * 3600 * 1000).toISOString(),
        });
      }

      totalInserted++;
    }
  }

  return NextResponse.json({ success: true, clients: DEMO_CLIENTS.length, reviews: totalInserted });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(plan)")
    .eq("id", user.id)
    .single();

  const userOrg = userRecord?.organization as { plan?: string } | null;
  if (userOrg?.plan !== "agency") {
    return NextResponse.json({ error: "Plano Agência necessário." }, { status: 403 });
  }

  const agencyOrgId = userRecord!.organization_id;

  const { data: demoOrgs } = await serviceClient
    .from("organizations")
    .select("id")
    .eq("parent_agency_id", agencyOrgId)
    .like("name", `${DEMO_ORG_PREFIX}%`);

  if (!demoOrgs || demoOrgs.length === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  const demoIds = demoOrgs.map((o) => o.id);

  const { data: demoLocations } = await serviceClient
    .from("locations")
    .select("id")
    .in("organization_id", demoIds);

  if (demoLocations && demoLocations.length > 0) {
    await serviceClient
      .from("reviews")
      .delete()
      .in("location_id", demoLocations.map((l) => l.id));
    await serviceClient
      .from("locations")
      .delete()
      .in("organization_id", demoIds);
  }

  const { count } = await serviceClient
    .from("organizations")
    .delete({ count: "exact" })
    .in("id", demoIds);

  return NextResponse.json({ success: true, deleted: count ?? demoIds.length });
}
