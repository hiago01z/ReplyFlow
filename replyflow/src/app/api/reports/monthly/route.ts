/**
 * GET /api/reports/monthly?month=YYYY-MM
 *
 * Sprint 22 — Relatório mensal de reputação (Pro/Agency plan).
 * Returns a print-optimised HTML page that can be saved as PDF.
 * Month defaults to the current month when omitted.
 *
 * Security: user must be authenticated; filtered by org.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { parseLocale } from "@/lib/i18n/locale";
import { REPORT } from "@/lib/i18n/strings-report";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com";

// Plans that can access monthly reports
const REPORT_PLANS = new Set(["pro", "agency"]);

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function pct(num: number, den: number) {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id, preferred_locale, organization:organizations(name, plan)")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const locale = parseLocale((userRecord as unknown as { preferred_locale?: string }).preferred_locale)
  const rpt = REPORT[locale]

  const org = userRecord.organization as unknown as { name: string; plan: string } | null;

  // Plan gate
  if (!REPORT_PLANS.has(org?.plan ?? "free")) {
    return NextResponse.json(
      { error: "upgrade_required", message: rpt.upgradeMsg },
      { status: 403 },
    );
  }

  // Parse month param (defaults to current month)
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM
  const now = new Date();
  const year  = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.split("-")[1]) : now.getMonth() + 1;

  if (
    Number.isNaN(year) || Number.isNaN(month) ||
    month < 1 || month > 12 ||
    year < 2020 || year > 2100
  ) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1).toISOString();
  const end   = new Date(year, month, 0, 23, 59, 59).toISOString();

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(rpt.htmlLang, { month: "long", year: "numeric" });

  // Fetch org's location IDs
  const { data: locs } = await serviceClient
    .from("locations")
    .select("id, name")
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true);

  const locIds   = (locs ?? []).map((l) => l.id);
  const locNames = Object.fromEntries((locs ?? []).map((l) => [l.id, l.name]));

  if (locIds.length === 0) {
    return NextResponse.json({ error: "No locations" }, { status: 404 });
  }

  // Fetch reviews for the month
  const { data: reviews } = await serviceClient
    .from("reviews")
    .select("id, location_id, rating, status, author_name, content, created_at")
    .in("location_id", locIds)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });

  const allReviews = reviews ?? [];

  // Compute totals
  const total      = allReviews.length;
  const published  = allReviews.filter((r) => r.status === "published").length;
  const pending    = allReviews.filter((r) => r.status === "pending").length;
  const ratings    = allReviews.filter((r) => r.rating).map((r) => r.rating as number);
  const avgRating  = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  const replyRate  = pct(published, total);

  // Per-location breakdown
  const byLocation: Record<string, { total: number; published: number; avgRating: number; ratings: number[] }> = {};
  for (const r of allReviews) {
    if (!byLocation[r.location_id]) {
      byLocation[r.location_id] = { total: 0, published: 0, avgRating: 0, ratings: [] };
    }
    byLocation[r.location_id].total++;
    if (r.status === "published") byLocation[r.location_id].published++;
    if (r.rating) byLocation[r.location_id].ratings.push(r.rating);
  }
  for (const loc of Object.values(byLocation)) {
    loc.avgRating = loc.ratings.length > 0
      ? +(loc.ratings.reduce((a, b) => a + b, 0) / loc.ratings.length).toFixed(1)
      : 0;
  }

  // Rating breakdown
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) ratingDist[r] = (ratingDist[r] ?? 0) + 1;

  // 5 most recent published reviews for highlights
  const highlights = allReviews
    .filter((r) => r.status === "published" && r.content)
    .slice(0, 5);

  // ── Build HTML ────────────────────────────────────────────────────────────
  const locRows = Object.entries(byLocation)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([id, s]) => `
      <tr>
        <td>${locNames[id] ?? id}</td>
        <td class="num">${s.total}</td>
        <td class="num">${s.published}</td>
        <td class="num">${pct(s.published, s.total)}</td>
        <td class="num">${s.avgRating > 0 ? s.avgRating.toFixed(1) + " ★" : "—"}</td>
      </tr>`).join("");

  const ratingRows = [5, 4, 3, 2, 1].map((n) => {
    const count = ratingDist[n] ?? 0;
    const bar   = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="rating-row">
        <span class="star-label">${n} ★</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${bar}%"></div></div>
        <span class="star-count">${count}</span>
      </div>`;
  }).join("");

  const highlightItems = highlights.map((r) => `
    <div class="highlight-card">
      <div class="hl-header">
        <span class="hl-author">${r.author_name ?? rpt.anonymous}</span>
        <span class="hl-stars">${stars(r.rating ?? 5)}</span>
        <span class="hl-date">${new Date(r.created_at).toLocaleDateString(rpt.htmlLang)}</span>
      </div>
      <p class="hl-text">"${(r.content ?? "").slice(0, 200)}${(r.content ?? "").length > 200 ? "…" : ""}"</p>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="${rpt.htmlLang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${rpt.title} — ${monthLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f9fafb;color:#111827;padding:32px;font-size:14px}
  @media print{body{background:#fff;padding:0}}
  .page{max-width:800px;margin:0 auto}
  /* Header */
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:16px;padding:32px;margin-bottom:24px}
  .header h1{font-size:24px;font-weight:800;margin-bottom:4px}
  .header p{opacity:.85;font-size:14px}
  .header .org{font-size:13px;opacity:.7;margin-top:2px}
  /* KPI cards */
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .kpi{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center}
  .kpi-value{font-size:28px;font-weight:800;color:#111827}
  .kpi-label{font-size:12px;color:#6b7280;margin-top:4px}
  /* Section */
  .section{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px}
  .section h2{font-size:15px;font-weight:700;margin-bottom:16px;color:#374151}
  /* Table */
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#9ca3af;padding:0 0 10px}
  td{padding:10px 0;border-top:1px solid #f3f4f6;font-size:13px}
  .num{text-align:right}
  /* Rating bars */
  .rating-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .star-label{width:28px;font-size:13px;color:#374151;font-weight:600}
  .bar-bg{flex:1;height:10px;background:#f3f4f6;border-radius:99px;overflow:hidden}
  .bar-fill{height:100%;background:#f59e0b;border-radius:99px;transition:width .3s}
  .star-count{width:24px;text-align:right;font-size:12px;color:#6b7280}
  /* Highlights */
  .highlight-card{background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:10px}
  .hl-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .hl-author{font-weight:600;font-size:13px}
  .hl-stars{color:#f59e0b;font-size:12px}
  .hl-date{margin-left:auto;font-size:11px;color:#9ca3af}
  .hl-text{font-size:13px;color:#4b5563;line-height:1.6}
  /* Footer */
  .footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb}
  /* Print button */
  .print-btn{display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px}
  .print-btn button{background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;
                     font-size:13px;font-weight:600;cursor:pointer}
  @media print{.print-btn{display:none}}
</style>
</head>
<body>
<div class="page">
  <div class="print-btn">
    <button onclick="window.print()">${rpt.savePdf}</button>
  </div>

  <div class="header">
    <h1>${rpt.title}</h1>
    <p>${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</p>
    <div class="org">🏢 ${org?.name ?? "Empresa"}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-value">${total}</div>
      <div class="kpi-label">${rpt.kpiReceived}</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${replyRate}</div>
      <div class="kpi-label">${rpt.kpiRate}</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${avgRating > 0 ? avgRating.toFixed(1) + " ★" : "—"}</div>
      <div class="kpi-label">${rpt.kpiAvgRating}</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${pending}</div>
      <div class="kpi-label">${rpt.kpiPending}</div>
    </div>
  </div>

  ${locIds.length > 1 ? `
  <div class="section">
    <h2>${rpt.secByLocation}</h2>
    <table>
      <thead>
        <tr>
          <th>${rpt.colLocation}</th>
          <th class="num">${rpt.colReviews}</th>
          <th class="num">${rpt.colReplied}</th>
          <th class="num">${rpt.colRate}</th>
          <th class="num">${rpt.colAvg}</th>
        </tr>
      </thead>
      <tbody>${locRows}</tbody>
    </table>
  </div>` : ""}

  <div class="section">
    <h2>${rpt.secStarDist}</h2>
    ${ratingRows}
  </div>

  ${highlights.length > 0 ? `
  <div class="section">
    <h2>${rpt.secHighlights}</h2>
    ${highlightItems}
  </div>` : ""}

  <div class="footer">
    ${rpt.footer(new Date().toLocaleDateString(rpt.htmlLang), APP_URL)}
  </div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
