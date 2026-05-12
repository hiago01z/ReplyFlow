/**
 * @deprecated Use /api/billing/extra-location (sem 's')
 * Este endpoint existe apenas para compatibilidade — redireciona para o correto.
 */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  return new NextResponse(body || null, {
    status:  308, // Permanent Redirect — preserva método POST
    headers: { Location: "/api/billing/extra-location" },
  });
}
