/**
 * POST /api/feedback
 *
 * Recebe feedback público da landing page e envia por e-mail via Resend.
 * Não exige autenticação.
 *
 * Body: { name?: string, email?: string, message: string }
 * Destino: FEEDBACK_TO_EMAIL (ou RESEND_FROM_EMAIL como fallback)
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL ?? "noreply@replyflow-hivi.com";
const TO     = process.env.FEEDBACK_TO_EMAIL ?? FROM;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com";

const schema = z.object({
  name:    z.string().max(100).optional(),
  email:   z.string().email().max(254).optional(),
  message: z.string().min(1, "Mensagem obrigatória").max(2000),
});

export async function POST(request: Request) {
  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;

  // Build HTML email
  const senderLine  = name  ? `<strong>${escapeHtml(name)}</strong>` : "<em>Anônimo</em>";
  const replyToLine = email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "<em>Não informado</em>";
  const timestamp   = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:700">💬 Novo Feedback — ReplyFlow</p>
            <p style="margin:4px 0 0;color:#c4b5fd;font-size:13px">${APP_URL}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td width="90" style="font-size:12px;color:#9ca3af;padding-bottom:10px">Nome</td>
                <td style="font-size:13px;color:#111827;padding-bottom:10px">${senderLine}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9ca3af;padding-bottom:10px">E-mail</td>
                <td style="font-size:13px;color:#111827;padding-bottom:10px">${replyToLine}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9ca3af">Recebido em</td>
                <td style="font-size:13px;color:#111827">${timestamp}</td>
              </tr>
            </table>

            <div style="background:#f9fafb;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:16px 20px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Mensagem</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${escapeHtml(message)}</p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:11px;color:#9ca3af">
              Enviado via formulário de feedback em <a href="${APP_URL}" style="color:#6366f1">${APP_URL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = name
    ? `Feedback de ${name} — ReplyFlow`
    : "Novo feedback anônimo — ReplyFlow";

  const sendOptions: Parameters<typeof resend.emails.send>[0] = {
    from:    `ReplyFlow Feedback <${FROM}>`,
    to:      TO,
    subject,
    html,
  };

  // Set reply-to if sender provided email
  if (email) {
    sendOptions.replyTo = email;
  }

  const result = await resend.emails.send(sendOptions);

  if (result.error) {
    console.error("[feedback] Resend error:", result.error);
    return NextResponse.json({ error: "Falha ao enviar. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

/** Basic HTML entity escaping to prevent XSS in email body */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
