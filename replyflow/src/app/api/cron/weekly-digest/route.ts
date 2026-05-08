/**
 * GET /api/cron/weekly-digest
 *
 * Sprint 27 — Weekly review digest email.
 * Runs every Monday via cron-job.org.
 * Sends each organization owner a summary of last 7 days:
 *   reviews received, response rate, avg rating, pending count.
 *
 * Auth: Bearer CRON_SECRET or ?secret=CRON_SECRET
 * Only sends to users with email_alerts enabled.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? "noreply@replyflow.com.br";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.replyflow.com.br";

export async function GET(request: Request) {
  const authHeader  = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    querySecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Fetch all active orgs with owner email + alert preference
  const { data: orgUsers } = await serviceClient
    .from("users")
    .select("email, email_alerts, name, organization:organizations(id, name, plan)")
    .eq("role", "owner");

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  let sent   = 0;
  let errors = 0;

  for (const u of orgUsers ?? []) {
    if (u.email_alerts === false) continue; // opted out

    const org = u.organization as unknown as { id: string; name: string; plan: string } | null;
    if (!org) continue;

    // Fetch location IDs for this org
    const { data: locs } = await serviceClient
      .from("locations")
      .select("id")
      .eq("organization_id", org.id)
      .eq("active", true);

    const locIds = (locs ?? []).map((l) => l.id);
    if (locIds.length === 0) continue;

    // Weekly stats
    const [
      { count: weeklyTotal },
      { count: weeklyPublished },
      { count: pendingTotal },
    ] = await Promise.all([
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds).gte("created_at", since),
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds).gte("created_at", since).eq("status", "published"),
      serviceClient.from("reviews").select("id", { count: "exact", head: true })
        .in("location_id", locIds).eq("status", "pending"),
    ]);

    // Avg rating last 7 days
    const { data: ratingRows } = await serviceClient
      .from("reviews")
      .select("rating")
      .in("location_id", locIds)
      .gte("created_at", since)
      .not("rating", "is", null);

    const ratings = (ratingRows ?? []).map((r) => r.rating as number);
    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    const replyRate = weeklyTotal && weeklyTotal > 0
      ? Math.round(((weeklyPublished ?? 0) / weeklyTotal) * 100)
      : 0;

    // Skip if nothing happened this week and nothing pending
    if ((weeklyTotal ?? 0) === 0 && (pendingTotal ?? 0) === 0) continue;

    const firstName   = (u.name ?? u.email).split(" ")[0];
    const reviewsUrl  = `${APP_URL}/reviews`;
    const dashboardUrl = `${APP_URL}/dashboard`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:800">⚡ ReplyFlow</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px">
              Seu resumo semanal, ${firstName}
            </p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.6);font-size:12px">${org.name}</p>
          </td>
        </tr>

        <!-- KPIs -->
        <tr>
          <td style="padding:28px 32px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${[
                  { label: "Reviews recebidos", value: weeklyTotal ?? 0, color: "#6366f1" },
                  { label: "Taxa de resposta",  value: `${replyRate}%`,  color: "#16a34a" },
                  { label: "Nota média",        value: avgRating ? `${avgRating} ★` : "—", color: "#f59e0b" },
                  { label: "Pendentes",         value: pendingTotal ?? 0, color: "#dc2626" },
                ].map(kpi => `
                  <td width="25%" style="text-align:center;padding:0 6px">
                    <div style="background:#f9fafb;border-radius:12px;padding:16px 8px">
                      <p style="margin:0;font-size:22px;font-weight:800;color:${kpi.color}">${kpi.value}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#6b7280">${kpi.label}</p>
                    </div>
                  </td>`).join("")}
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px 32px;text-align:center">
            ${(pendingTotal ?? 0) > 0
              ? `<p style="margin:0 0 16px;font-size:14px;color:#374151">
                  Você tem <strong style="color:#dc2626">${pendingTotal} review${(pendingTotal ?? 0) !== 1 ? "s" : ""} pendente${(pendingTotal ?? 0) !== 1 ? "s" : ""}</strong> aguardando resposta.
                </p>`
              : `<p style="margin:0 0 16px;font-size:14px;color:#374151">
                  Ótimo trabalho! Todos os reviews estão respondidos. 🎉
                </p>`
            }
            <a href="${(pendingTotal ?? 0) > 0 ? reviewsUrl + "?status=pending" : dashboardUrl}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
              ${(pendingTotal ?? 0) > 0 ? "Responder reviews →" : "Ver dashboard →"}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:11px;color:#9ca3af">
              ReplyFlow · Resumo semanal de reputação.<br/>
              Para parar de receber, acesse <a href="${APP_URL}/settings" style="color:#6366f1">Configurações</a> e desative alertas.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await resend.emails.send({
        from:    `ReplyFlow <${FROM}>`,
        to:      u.email,
        subject: `📊 Seu resumo semanal — ${weeklyTotal ?? 0} review${(weeklyTotal ?? 0) !== 1 ? "s" : ""}, ${replyRate}% respondidos`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[weekly-digest] email error for ${u.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    errors,
    timestamp: new Date().toISOString(),
  });
}
