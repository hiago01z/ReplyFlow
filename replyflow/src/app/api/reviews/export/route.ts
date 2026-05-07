import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(cols: (string | null | undefined)[]): string {
  return cols.map(escapeCsv).join(",");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: userRecord } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: locations } = await serviceClient
    .from("locations")
    .select("id")
    .eq("organization_id", userRecord.organization_id)
    .eq("active", true);

  const locationIds = (locations ?? []).map((l) => l.id);
  if (locationIds.length === 0) {
    return new Response("", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="reviews.csv"',
      },
    });
  }

  // Parse filters from URL
  const url = new URL(request.url);
  const status     = url.searchParams.get("status") ?? "";
  const rating     = url.searchParams.get("rating") ?? "";
  const locationId = url.searchParams.get("locationId") ?? "";
  const search     = url.searchParams.get("search") ?? "";

  let query = serviceClient
    .from("reviews")
    .select("*, location:locations(name), response:responses(content, published_at)")
    .in("location_id", locationId ? [locationId] : locationIds)
    .order("platform_published_at", { ascending: false })
    .limit(5000); // safety cap

  if (status)  query = query.eq("status", status);
  if (rating)  query = query.eq("rating", parseInt(rating));
  if (search) {
    const term = `%${search}%`;
    query = query.or(`content.ilike.${term},author_name.ilike.${term}`);
  }

  const { data: reviews } = await query;

  const header = rowToCsv([
    "ID", "Local", "Plataforma", "Autor", "Estrelas", "Status",
    "Texto do review", "Data do review",
    "Resposta gerada", "Data de publicação",
  ]);

  const rows = (reviews ?? []).map((r) => {
    const loc = r.location as unknown as { name: string } | null;
    const resp = r.response as unknown as { content: string; published_at: string | null } | null;
    return rowToCsv([
      r.id,
      loc?.name ?? "",
      r.platform,
      r.author_name,
      String(r.rating ?? ""),
      r.status,
      r.content,
      r.platform_published_at ? new Date(r.platform_published_at).toLocaleDateString("pt-BR") : "",
      resp?.content ?? "",
      resp?.published_at ? new Date(resp.published_at).toLocaleDateString("pt-BR") : "",
    ]);
  });

  const csv = [header, ...rows].join("\n");

  return new Response("﻿" + csv, { // BOM for Excel UTF-8 compatibility
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reviews-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
