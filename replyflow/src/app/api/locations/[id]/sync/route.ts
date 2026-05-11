/**
 * POST /api/locations/[id]/sync
 *
 * Sprint 23 — Manual sync: fetches new GMB reviews for a single location
 * on-demand, without waiting for the 30-minute cron job.
 *
 * Rate-limited to 1 sync per location per 2 minutes.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
import { syncLocationReviews } from "@/lib/gmb/syncLocation";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 1 manual sync per location per 2 minutes
  const rl = await rateLimit(`rl:sync:loc:${id}`, 1, 120);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limit", message: "Aguarde 2 minutos entre sincronizações manuais." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
      },
    );
  }

  const serviceClient = createServiceClient();

  // Verify ownership
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  // ── Step 1: fetch location (no org join to avoid failure if migration not applied) ──
  const { data: location, error: locError } = await serviceClient
    .from("locations")
    .select("id, name, organization_id, google_access_token, google_refresh_token, google_location_name, auto_publish, auto_publish_min_rating")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true)
    .not("google_access_token", "is", null)
    .not("google_location_name", "is", null)
    .single();

  if (locError || !location) {
    console.warn("[sync] location query failed:", locError?.message ?? "not found", { id, orgId: userRecord.organization_id });
    return NextResponse.json(
      { error: "Location not found or Google not connected", detail: locError?.message },
      { status: 404 },
    );
  }

  // ── Step 2: fetch org data separately (tolerant of missing columns) ──────────
  let orgPlan: string = "free";
  let orgAlertEmail: string | null = null;
  try {
    const { data: orgData } = await serviceClient
      .from("organizations")
      .select("plan, alert_email")
      .eq("id", userRecord.organization_id)
      .single();
    orgPlan       = orgData?.plan ?? "free";
    orgAlertEmail = (orgData as Record<string, unknown>)?.alert_email as string | null ?? null;
  } catch { /* ignore — org data is optional for sync */ }

  const result = await syncLocationReviews({
    ...location,
    google_refresh_token: location.google_refresh_token ?? null,
    auto_publish_min_rating: location.auto_publish_min_rating ?? 3,
    organization: { plan: orgPlan, alert_email: orgAlertEmail },
  });

  return NextResponse.json({
    success:    true,
    newReviews: result.newReviews,
    alertsSent: result.alertsSent,
    errors:     result.errors,
    timestamp:  new Date().toISOString(),
  });
}
