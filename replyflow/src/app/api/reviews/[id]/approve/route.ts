/**
 * GET /api/reviews/[id]/approve?token=XXX
 *
 * Sprint 21 — WhatsApp 1-click approval.
 * The user taps the link in WhatsApp → this endpoint verifies the HMAC token,
 * publishes the response to Google My Business, and returns a success HTML page.
 *
 * No session required — the token IS the authentication.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { verifyApprovalToken } from "@/lib/approvalToken";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com";

function htmlPage(title: string, emoji: string, body: string, color: string) {
  return new Response(
    `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ReplyFlow</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}
    .card{background:#fff;border-radius:20px;border:1px solid #e5e7eb;
          box-shadow:0 4px 24px rgba(0,0,0,.06);padding:40px 32px;max-width:400px;width:100%;text-align:center}
    .emoji{font-size:56px;margin-bottom:16px}
    h1{font-size:22px;font-weight:800;color:#111827;margin-bottom:8px}
    p{font-size:15px;color:#6b7280;line-height:1.6;margin-bottom:24px}
    a{display:inline-block;background:${color};color:#fff;text-decoration:none;
      padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>${title}</h1>
    ${body}
    <a href="${APP_URL}/reviews">Ver reviews →</a>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reviewId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // ── Verify token ─────────────────────────────────────────────────────────
  if (!token) {
    return htmlPage("Link inválido", "⚠️",
      "<p>Este link está incompleto ou expirado.<br>Acesse o dashboard para publicar manualmente.</p>",
      "#6366f1");
  }

  const payload = verifyApprovalToken(token);
  if (!payload || payload.reviewId !== reviewId) {
    return htmlPage("Link expirado", "⏰",
      "<p>Este link de aprovação expirou (válido por 48 horas).<br>Acesse o dashboard para publicar manualmente.</p>",
      "#6366f1");
  }

  const { responseId } = payload;
  const serviceClient = createServiceClient();

  // ── Buscar review + response ──────────────────────────────────────────────
  const { data: review } = await serviceClient
    .from("reviews")
    .select("*, location:locations(*)")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return htmlPage("Review não encontrado", "🔍",
      "<p>O review não foi encontrado. Pode ter sido removido.</p>",
      "#6366f1");
  }

  // Já publicado
  if (review.status === "published") {
    return htmlPage("Já publicado!", "✅",
      "<p>Esta resposta já foi publicada no Google. Tudo certo!</p>",
      "#16a34a");
  }

  const { data: response } = await serviceClient
    .from("responses")
    .select("content")
    .eq("id", responseId)
    .single();

  if (!response?.content) {
    return htmlPage("Resposta não encontrada", "🔍",
      "<p>O rascunho de resposta não foi encontrado. Acesse o dashboard para gerar novamente.</p>",
      "#6366f1");
  }

  // ── Publicar no Google My Business ───────────────────────────────────────
  const location = review.location as Record<string, unknown>;

  if (
    review.platform === "google" &&
    review.external_id &&
    location?.google_access_token &&
    location?.google_location_name
  ) {
    try {
      const gmb = new GoogleMyBusinessClient({
        accessToken:  location.google_access_token as string,
        refreshToken: (location.google_refresh_token as string) ?? null,
        locationName: location.google_location_name as string,
      });
      const reviewName = `${location.google_location_name}/reviews/${review.external_id}`;
      await gmb.replyToReview(reviewName, response.content);
    } catch (err) {
      console.error("[approve] GMB publish error:", err);
      return htmlPage("Erro ao publicar", "❌",
        "<p>Não foi possível publicar no Google. Acesse o dashboard para tentar novamente.</p>",
        "#dc2626");
    }
  }

  const now = new Date().toISOString();

  // ── Atualizar banco ───────────────────────────────────────────────────────
  await Promise.all([
    serviceClient
      .from("responses")
      .update({ published_at: now, approved_at: now })
      .eq("id", responseId),
    serviceClient
      .from("reviews")
      .update({ status: "published" })
      .eq("id", reviewId),
  ]);

  return htmlPage("Resposta publicada! 🎉", "✅",
    "<p>Sua resposta foi publicada no Google com sucesso.<br>Obrigado por usar o ReplyFlow!</p>",
    "#16a34a");
}
