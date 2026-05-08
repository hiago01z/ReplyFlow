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

  const { data: location } = await serviceClient
    .from("locations")
    .select("*, organization:organizations(plan, alert_email)")
    .eq("id", id)
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true)
    .not("google_access_token", "is", null)
    .not("google_location_name", "is", null)
    .single();

  if (!location) {
    return NextResponse.json(
      { error: "Location not found or Google not connected" },
      { status: 404 },
    );
  }

  const result = await syncLocationReviews(location as Parameters<typeof syncLocationReviews>[0]);

  return NextResponse.json({
    success:    true,
    newReviews: result.newReviews,
    alertsSent: result.alertsSent,
    errors:     result.errors,
    timestamp:  new Date().toISOString(),
  });
}
