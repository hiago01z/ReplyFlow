import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { PLAN_LIMITS, countConnectedPlatforms, type Plan } from "@/lib/plan-limits";
import { z } from "zod";

const updateSchema = z.object({
  name:         z.string().min(2).max(100).optional(),
  niche:        z.enum(["clinica", "restaurante", "academia", "petshop", "barbearia", "outro"]).optional(),
  tone:         z.enum(["formal", "amigavel", "descontraido"]).optional(),
  auto_publish:            z.boolean().optional(),
  auto_publish_min_rating: z.number().int().min(1).max(5).optional(),
  active:                  z.boolean().optional(),
  google_location_name: z.string().nullable().optional(),
  google_account_id:    z.string().nullable().optional(),
  is_public:   z.boolean().optional(),
  public_slug: z.string().regex(/^[a-z0-9-]{3,60}$/).nullable().optional(),
  // TripAdvisor
  tripadvisor_url:       z.string().url().nullable().optional(),
  tripadvisor_connected: z.boolean().optional(),
  // Reclame Aqui
  reclame_aqui_url:       z.string().url().nullable().optional(),
  reclame_aqui_connected: z.boolean().optional(),
  // Facebook (set by callback; disconnect via false)
  facebook_page_id:      z.string().nullable().optional(),
  facebook_page_name:    z.string().nullable().optional(),
  facebook_access_token: z.string().nullable().optional(),
  facebook_connected:    z.boolean().optional(),
});

// ── helpers ────────────────────────────────────────────────────────────────

interface OrgData {
  id: string;
  plan: string;
  extra_locations: number;
  stripe_subscription_id: string | null;
  stripe_extra_locations_item_id: string | null;
}

async function getOwnedLocationWithOrg(userId: string, locationId: string) {
  const serviceClient = createServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, organization:organizations(id, plan, extra_locations, stripe_subscription_id, stripe_extra_locations_item_id)")
    .eq("id", userId)
    .single();
  if (!userRecord?.organization_id) return null;

  const { data: location } = await serviceClient
    .from("locations")
    .select("id, organization_id, active")
    .eq("id", locationId)
    .eq("organization_id", userRecord.organization_id)
    .single();

  if (location) {
    return {
      location,
      org: userRecord.organization as unknown as OrgData,
      orgId: userRecord.organization_id as string,
    };
  }

  // Allow agency users to access their client locations
  const userOrg = userRecord.organization as unknown as OrgData;
  if (userOrg?.plan === "agency") {
    const { data: agencyLocation } = await serviceClient
      .from("locations")
      .select("id, organization_id, active")
      .eq("id", locationId)
      .single();

    if (agencyLocation) {
      const { data: clientOrg } = await serviceClient
        .from("organizations")
        .select("id, plan, extra_locations, stripe_subscription_id, stripe_extra_locations_item_id")
        .eq("id", agencyLocation.organization_id)
        .eq("parent_agency_id", userRecord.organization_id)
        .single();

      if (clientOrg) {
        return {
          location: agencyLocation,
          org: clientOrg as unknown as OrgData,
          orgId: agencyLocation.organization_id,
        };
      }
    }
  }

  return null;
}

/**
 * Ajusta a quantidade de locais extras no Stripe e no banco
 * sempre que o número de locais ativos muda.
 *
 * newActiveCount = contagem APÓS a ação (desativar/excluir).
 */
async function syncExtraLocationsSlot(org: OrgData, newActiveCount: number) {
  const serviceClient = createServiceClient();
  const baseLimit = PLAN_LIMITS[org.plan as Plan]?.locations ?? 1;
  const newExtraNeeded = Math.max(0, newActiveCount - baseLimit);

  // Nada mudou
  if (newExtraNeeded === org.extra_locations) return;

  // Sem Stripe → apenas atualiza o banco
  if (!org.stripe_subscription_id) {
    await serviceClient
      .from("organizations")
      .update({ extra_locations: newExtraNeeded })
      .eq("id", org.id);
    return;
  }

  try {
    if (org.stripe_extra_locations_item_id) {
      if (newExtraNeeded === 0) {
        // Remove o item de add-on da assinatura
        await stripe.subscriptionItems.del(org.stripe_extra_locations_item_id, {
          proration_behavior: "always_invoice",
        });
        await serviceClient
          .from("organizations")
          .update({ stripe_extra_locations_item_id: null, extra_locations: 0 })
          .eq("id", org.id);
      } else {
        // Reduz a quantidade
        await stripe.subscriptionItems.update(org.stripe_extra_locations_item_id, {
          quantity: newExtraNeeded,
          proration_behavior: "always_invoice",
        });
        await serviceClient
          .from("organizations")
          .update({ extra_locations: newExtraNeeded })
          .eq("id", org.id);
      }
    } else {
      // Sem item de add-on ativo — apenas sincroniza o DB
      await serviceClient
        .from("organizations")
        .update({ extra_locations: newExtraNeeded })
        .eq("id", org.id);
    }
  } catch (err) {
    console.error("[locations] syncExtraLocationsSlot error:", err instanceof Error ? err.message : err);
    // Mesmo com erro no Stripe, atualiza o banco para não ficar inconsistente
    await serviceClient
      .from("organizations")
      .update({ extra_locations: newExtraNeeded })
      .eq("id", org.id);
  }
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getOwnedLocationWithOrg(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serviceClient = createServiceClient();
  const { data: location } = await serviceClient
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  return NextResponse.json({ location });
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getOwnedLocationWithOrg(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // ── Reativação: verificar slot disponível ─────────────────────────────────
  if (parsed.data.active === true && !ctx.location.active) {
    const { count: activeCount } = await serviceClient
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.orgId)
      .eq("active", true);

    const baseLimit = PLAN_LIMITS[ctx.org.plan as Plan]?.locations ?? 1;
    const totalLimit = baseLimit + (ctx.org.extra_locations ?? 0);

    if ((activeCount ?? 0) >= totalLimit) {
      return NextResponse.json(
        {
          error:        "needs_slot",
          message:      "Limite de locais atingido. Compre um local extra para reativar.",
          currentExtra: ctx.org.extra_locations ?? 0,
        },
        { status: 403 },
      );
    }
    // Slot disponível — apenas ativa, sem ajuste de Stripe necessário
  }

  // ── Conexão de nova plataforma: verificar limite do plano ────────────────
  const connectingTripAdvisor  = parsed.data.tripadvisor_connected === true;
  const connectingFacebook     = parsed.data.facebook_connected === true;
  const connectingReclamaAqui  = parsed.data.reclame_aqui_connected === true;

  if (connectingTripAdvisor || connectingFacebook || connectingReclamaAqui) {
    const { data: locFull } = await serviceClient
      .from("locations")
      .select("google_access_token, tripadvisor_connected, facebook_connected, reclame_aqui_connected")
      .eq("id", id)
      .single();

    if (locFull) {
      const plan            = ctx.org.plan as Plan;
      const platformLimit   = PLAN_LIMITS[plan]?.platforms ?? 2;
      const currentCount    = countConnectedPlatforms(locFull);

      // Verificar se a plataforma específica já está conectada (evitar falso positivo)
      const alreadyConnected =
        (connectingTripAdvisor  && locFull.tripadvisor_connected) ||
        (connectingFacebook     && locFull.facebook_connected) ||
        (connectingReclamaAqui  && locFull.reclame_aqui_connected);

      if (!alreadyConnected && currentCount >= platformLimit) {
        return NextResponse.json(
          {
            error:   "platform_limit",
            message: `Seu plano ${plan} permite até ${platformLimit} plataformas por local.`,
            limit:   platformLimit,
          },
          { status: 403 },
        );
      }
    }
  }

  // ── Desativação: ajustar Stripe ───────────────────────────────────────────
  if (parsed.data.active === false && ctx.location.active) {
    // Contar ativos ANTES de desativar (inclui o próprio local)
    const { count: activeCount } = await serviceClient
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.orgId)
      .eq("active", true);

    const newActiveCount = (activeCount ?? 1) - 1;
    await syncExtraLocationsSlot(ctx.org, newActiveCount);
  }

  // ── Atualizar o local ─────────────────────────────────────────────────────
  const { data: location, error } = await serviceClient
    .from("locations")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[locations] update error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }

  return NextResponse.json({ location });
}

// ── DELETE (hard delete) ───────────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getOwnedLocationWithOrg(user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serviceClient = createServiceClient();

  // Só ajusta o Stripe se o local estava ativo (consumia um slot)
  if (ctx.location.active) {
    const { count: activeCount } = await serviceClient
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.orgId)
      .eq("active", true);

    const newActiveCount = (activeCount ?? 1) - 1;
    await syncExtraLocationsSlot(ctx.org, newActiveCount);
  }

  // Hard delete — cascade remove reviews, responses, alerts
  const { error } = await serviceClient
    .from("locations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[locations] delete error:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
