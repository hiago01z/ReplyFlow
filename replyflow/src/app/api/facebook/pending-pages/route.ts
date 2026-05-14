/**
 * GET /api/facebook/pending-pages
 *
 * Devolve os dados de páginas Facebook armazenados no cookie HTTP-only
 * após o OAuth callback (evita expor tokens na URL).
 * Limpa o cookie após a leitura (uso único).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface PendingPage {
  id:    string;
  name:  string;
  token: string;
}

interface PendingData {
  locationId: string;
  expiresAt:  string | null;
  pages:      PendingPage[];
}

export async function GET() {
  // Require authenticated session so random visitors can't drain the cookie
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const raw = cookieStore.get("fb_pending_pages")?.value;

  if (!raw) {
    return NextResponse.json({ error: "No pending pages" }, { status: 404 });
  }

  let data: PendingData;
  try {
    data = JSON.parse(raw) as PendingData;
  } catch {
    return NextResponse.json({ error: "Invalid cookie data" }, { status: 400 });
  }

  // Clear the cookie after reading (single-use)
  const response = NextResponse.json(data);
  response.cookies.set("fb_pending_pages", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });

  return response;
}
